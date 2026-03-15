import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { PlayingCard, CARD_BACK_DESIGNS } from '../../components/PlayingCard';
import type { CardBackDesign } from '../../components/PlayingCard';
import { useSpider } from './useSpider';

const CARD_W = 74;
const CARD_H = 104;
const FACE_DOWN_OFFSET = 8;
const FACE_UP_OFFSET = 26;
const DRAG_THRESHOLD = 4;

interface DragState {
  col: number;
  cardIndex: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  offsetX: number;
  offsetY: number;
}

export function SpiderGame() {
  const game = useSpider();
  const [backDesign, setBackDesign] = useState<CardBackDesign>('classic');
  const [showBackPicker, setShowBackPicker] = useState(false);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => { dragRef.current = drag; }, [drag]);

  const currentDesign = useMemo(
    () => CARD_BACK_DESIGNS.find(d => d.id === backDesign) ?? CARD_BACK_DESIGNS[0],
    [backDesign],
  );

  const getCardAnimationDelay = (colIdx: number, cardIdx: number): number => {
    const totalCards = 54;
    let globalIdx = 0;
    for (let c = 0; c < colIdx; c++) {
      globalIdx += c < 4 ? 6 : 5;
    }
    globalIdx += cardIdx;
    return (globalIdx / totalCards) * 1.2;
  };

  const findDropColumn = useCallback((clientX: number, clientY: number, srcCol: number): number | null => {
    for (let i = 0; i < 10; i++) {
      const el = columnRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top - 20 && clientY <= rect.bottom + 40) {
        if (i === srcCol) return null;
        return i;
      }
    }
    return null;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, colIdx: number, cardIdx: number) => {
    if (!game.canDrag(colIdx, cardIdx)) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    const newDrag: DragState = {
      col: colIdx,
      cardIndex: cardIdx,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };

    dragRef.current = newDrag;
    setDrag(newDrag);
    e.preventDefault();
  }, [game]);

  useEffect(() => {
    if (!drag) return;

    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;

      const dx = Math.abs(e.clientX - d.startX);
      const dy = Math.abs(e.clientY - d.startY);
      if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) return;

      const updated = { ...d, currentX: e.clientX, currentY: e.clientY };
      dragRef.current = updated;
      setDrag(updated);

      const col = findDropColumn(e.clientX, e.clientY, d.col);
      if (col !== null && game.canDrop(d.col, d.cardIndex, col)) {
        setDropTarget(col);
      } else {
        setDropTarget(null);
      }
    };

    const onUp = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;

      const dx = Math.abs(e.clientX - d.startX);
      const dy = Math.abs(e.clientY - d.startY);

      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        const col = findDropColumn(e.clientX, e.clientY, d.col);
        if (col !== null && game.canDrop(d.col, d.cardIndex, col)) {
          game.moveCards(d.col, d.cardIndex, col);
        }
      } else {
        game.selectCard(d.col, d.cardIndex);
      }

      dragRef.current = null;
      setDrag(null);
      setDropTarget(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [drag !== null, findDropColumn, game]);

  const isDragging = drag !== null &&
    (Math.abs(drag.currentX - drag.startX) > DRAG_THRESHOLD || Math.abs(drag.currentY - drag.startY) > DRAG_THRESHOLD);

  const draggedCards = isDragging && drag
    ? game.columns[drag.col].slice(drag.cardIndex)
    : [];

  return (
    <div
      className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-felt-dark via-felt to-felt-dark flex flex-col items-center px-3 py-4"
      style={{ touchAction: 'none' }}
    >
      {/* ── Top bar ── */}
      <div className="w-full max-w-7xl flex flex-wrap justify-between items-start mb-5 px-3 gap-4">
        {/* Left: actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={game.newGame}
            className="px-5 py-2.5 rounded-lg font-medium text-sm bg-slate-700 hover:bg-slate-600 text-white transition-all"
          >
            Nuevo juego
          </button>

          <button
            onClick={() => setShowBackPicker(v => !v)}
            className="relative px-4 py-2.5 rounded-lg font-medium text-sm bg-slate-700 hover:bg-slate-600 text-white transition-all flex items-center gap-2"
          >
            <span
              className="inline-block w-5 h-7 rounded border"
              style={{
                borderColor: currentDesign.border,
                background: `linear-gradient(135deg, ${currentDesign.colors[0]}, ${currentDesign.colors[2]})`,
              }}
            />
            Reverso
          </button>
        </div>

        {/* Right: stats + stock pile */}
        <div className="flex flex-col items-end gap-2.5">
          <div className="flex items-center gap-5 text-sm">
            <span className="text-slate-300">
              Movimientos: <strong className="text-white">{game.moves}</strong>
            </span>
            <span className="text-slate-300">
              Completadas: <strong className="text-amber-400">{game.completed}/8</strong>
            </span>
          </div>

          {/* Stock pile (click to deal) */}
          {game.stock.length > 0 ? (
            <button
              onClick={game.dealFromStock}
              className="group flex items-center gap-3 px-3 py-2 rounded-xl transition-all hover:bg-white/5 active:scale-[0.97]"
            >
              <div className="relative flex -space-x-3">
                {Array.from({ length: Math.min(5, game.stockDeals) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-9 h-12 rounded-md border-2 shadow-md transition-transform group-hover:-translate-y-0.5 relative overflow-hidden"
                    style={{
                      borderColor: currentDesign.border,
                      background: `linear-gradient(135deg, ${currentDesign.colors[0]}, ${currentDesign.colors[1]}, ${currentDesign.colors[2]})`,
                      zIndex: i,
                      transitionDelay: `${i * 30}ms`,
                    }}
                  >
                    <div
                      className="absolute inset-0 flex items-center justify-center opacity-25"
                      style={{ fontSize: 9, color: currentDesign.border }}
                    >
                      {currentDesign.pattern}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                  Repartir
                </span>
                <span className="text-xs text-slate-400 leading-tight">
                  {game.stockDeals} restante{game.stockDeals !== 1 ? 's' : ''}
                </span>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-3 px-3 py-2 opacity-40">
              <div className="w-9 h-12 rounded-md border-2 border-dashed border-slate-600 flex items-center justify-center">
                <span className="text-slate-600 text-sm">--</span>
              </div>
              <span className="text-xs text-slate-500">Sin cartas</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Card back picker ── */}
      {showBackPicker && (
        <div className="w-full max-w-7xl mb-3 px-2">
          <div className="bg-slate-800/90 backdrop-blur rounded-xl p-4 shadow-xl border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Elige el reverso de las cartas</h3>
            <div className="flex flex-wrap gap-3">
              {CARD_BACK_DESIGNS.map(design => {
                const isActive = backDesign === design.id;
                return (
                  <button
                    key={design.id}
                    onClick={() => { setBackDesign(design.id); setShowBackPicker(false); }}
                    className={`
                      flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all
                      animate-card-back-hover
                      ${isActive
                        ? 'bg-white/10 ring-2 ring-amber-400 shadow-lg'
                        : 'bg-white/5 hover:bg-white/10'
                      }
                    `}
                  >
                    <div
                      className="w-14 h-20 rounded-lg border-2 flex items-center justify-center shadow-md relative overflow-hidden"
                      style={{
                        borderColor: design.border,
                        background: `linear-gradient(135deg, ${design.colors[0]}, ${design.colors[1]}, ${design.colors[2]})`,
                      }}
                    >
                      <div className="absolute inset-1 rounded opacity-15 overflow-hidden flex flex-wrap items-center justify-center"
                        style={{ fontSize: 7, color: design.border }}
                      >
                        {Array.from({ length: 12 }).map((_, i) => (
                          <span key={i} className="inline-block w-2.5 text-center">{design.pattern}</span>
                        ))}
                      </div>
                      <span
                        className="relative z-10"
                        style={{ fontSize: 18, color: design.border, opacity: 0.8 }}
                      >
                        {design.pattern}
                      </span>
                    </div>
                    <span className={`text-xs font-medium ${isActive ? 'text-amber-400' : 'text-slate-400'}`}>
                      {design.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Game won overlay ── */}
      {game.gameWon && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl p-8 text-center shadow-2xl border border-amber-500/30">
            <h2 className="text-4xl font-bold text-amber-400 mb-2">Ganaste!</h2>
            <p className="text-slate-300 mb-4">
              Completaste el juego en {game.moves} movimientos
            </p>
            <button
              onClick={game.newGame}
              className="px-8 py-3 bg-gradient-to-b from-green-500 to-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-green-500/30 transition-all"
            >
              Jugar de nuevo
            </button>
          </div>
        </div>
      )}

      {/* ── Columns ── */}
      <div className="w-full max-w-7xl flex gap-[3px] overflow-x-auto pb-4">
        {game.columns.map((column, colIdx) => {
          const totalHeight = column.length === 0
            ? CARD_H
            : CARD_H + column.slice(0, -1).reduce(
                (sum, card) => sum + (card.faceUp ? FACE_UP_OFFSET : FACE_DOWN_OFFSET),
                0,
              );

          const isDropHere = dropTarget === colIdx;

          return (
            <div
              key={colIdx}
              ref={el => { columnRefs.current[colIdx] = el; }}
              className={`flex-1 min-w-[68px] rounded-lg transition-colors ${isDropHere ? 'bg-emerald-500/15' : ''}`}
              onClick={() => column.length === 0 && game.clickEmptyColumn(colIdx)}
            >
              <div
                className="relative mx-auto"
                style={{ height: totalHeight, maxWidth: CARD_W }}
              >
                {column.length === 0 ? (
                  <div
                    className={`rounded-lg border-2 border-dashed flex items-center justify-center transition-colors ${
                      isDropHere
                        ? 'border-emerald-400/50 bg-emerald-500/10'
                        : 'border-white/15 bg-white/[0.03]'
                    }`}
                    style={{ width: CARD_W, height: CARD_H }}
                  >
                    <span className={`text-2xl ${isDropHere ? 'text-emerald-400/60' : 'text-white/20'}`}>+</span>
                  </div>
                ) : (
                  column.map((card, cardIdx) => {
                    let top = 0;
                    for (let i = 0; i < cardIdx; i++) {
                      top += column[i].faceUp ? FACE_UP_OFFSET : FACE_DOWN_OFFSET;
                    }

                    const isSelected =
                      game.selected !== null &&
                      game.selected.col === colIdx &&
                      cardIdx >= game.selected.cardIndex;

                    const isBeingDragged =
                      isDragging && drag!.col === colIdx && cardIdx >= drag!.cardIndex;

                    const isDealing = game.dealing && game.dealingCards.has(card.id);
                    const isInitialDeal = game.initialDeal && game.initialDealCards.has(card.id);

                    const animClass = isDealing
                      ? 'animate-spider-deal'
                      : isInitialDeal
                        ? 'animate-spider-cascade'
                        : '';

                    const animDelay = isDealing
                      ? `${colIdx * 0.06}s`
                      : isInitialDeal
                        ? `${getCardAnimationDelay(colIdx, cardIdx)}s`
                        : undefined;

                    const canStartDrag = card.faceUp && game.canDrag(colIdx, cardIdx);

                    return (
                      <div
                        key={card.id}
                        className={`absolute left-0 ${animClass} ${canStartDrag ? 'cursor-grab active:cursor-grabbing' : ''}`}
                        style={{
                          top,
                          zIndex: cardIdx,
                          animationDelay: animDelay,
                          visibility: isBeingDragged ? 'hidden' : 'visible',
                        }}
                        onPointerDown={canStartDrag ? (e) => handlePointerDown(e, colIdx, cardIdx) : undefined}
                      >
                        <PlayingCard
                          card={card}
                          size="spider"
                          selected={isSelected && !isDragging}
                          backDesign={backDesign}
                          onClick={() => {}}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Drag ghost overlay ── */}
      {isDragging && drag && draggedCards.length > 0 && (
        <div
          className="fixed pointer-events-none"
          style={{
            left: drag.currentX - drag.offsetX,
            top: drag.currentY - drag.offsetY,
            zIndex: 1000,
          }}
        >
          {draggedCards.map((card, i) => (
            <div
              key={card.id}
              className="absolute left-0"
              style={{ top: i * FACE_UP_OFFSET }}
            >
              <div className="drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] scale-105">
                <PlayingCard
                  card={card}
                  size="spider"
                  backDesign={backDesign}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
