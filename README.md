# Modo Avión

Suite de juegos para **3 celulares**, pensada para el rato en el avión: funciona **offline** y se juega de a tres.

Bluetooth entre navegadores no sirve para armar una partida. El truco es más simple:

1. Instalá la app (o abrila una vez con internet) **antes de volar**.
2. En el avión, un celular prende el **hotspot / punto de acceso**. Ese celular abre la cabina.
3. Los otros dos se conectan a ese Wi‑Fi (no hace falta internet).
4. Escanean el QR y listo.

Si el emparejado no engancha, el anfitrión puede cargar la IP del hotspot (en Android suele ser `192.168.43.1`, en iPhone `172.20.10.1`).

También hay modo **pasar el celular** si no quieren pelearse con el Wi‑Fi.

## Juegos

- **Basta** — letra + categorías
- **Ventanilla** — uno dibuja, los otros adivinan
- **Sílabomba** — palabras con una sílaba, contra el reloj
- **La Mente** — números en orden, sin hablar
- **Trivial de cabina** — preguntas a la vez
- **Mentiroso** — cartas boca abajo y farol

## Desarrollo

```bash
npm install
npm test
npm run dev
```

Demo de 3 “celulares” en una sola página: [http://localhost:5173/?demo=1](http://localhost:5173/?demo=1)
