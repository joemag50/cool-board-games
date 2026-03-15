# Cool Board Games

Coleccion de juegos de mesa clasicos para jugar en el navegador, construido con React, TypeScript, Vite y Tailwind CSS.

## Juegos disponibles

| Juego | Descripcion |
|-------|-------------|
| Blackjack | Vence al dealer llegando a 21 sin pasarte |
| Spider Solitario | Ordena las cartas de K a A en secuencias completas |
| Yahtzee | Lanza los dados y busca las mejores combinaciones |

## Requisitos

- [Node.js](https://nodejs.org/) v18 o superior
- npm (incluido con Node.js)

## Inicio rapido

```bash
# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

La app se abre en [http://localhost:5173](http://localhost:5173).

## Scripts disponibles

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo con hot reload |
| `npm run build` | Compila TypeScript y genera el build de produccion |
| `npm run preview` | Sirve el build de produccion localmente |
| `npm run lint` | Ejecuta ESLint sobre el proyecto |

## Estructura del proyecto

```
src/
  App.tsx              # Componente principal con lobby y navegacion
  main.tsx             # Entry point
  components/          # Componentes compartidos (PlayingCard, Dice)
  games/
    registry.ts        # Registro central de juegos
    blackjack/         # Blackjack
    spider/            # Spider Solitario
    yahtzee/           # Yahtzee
  types/               # Tipos compartidos
```

## Tech stack

- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/) 5.9
- [Vite](https://vite.dev/) 7
- [Tailwind CSS](https://tailwindcss.com/) 4
