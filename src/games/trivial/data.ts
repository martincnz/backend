export type TriviaQuestion = {
  q: string;
  options: [string, string, string, string];
  ok: 0 | 1 | 2 | 3;
};

export const QUESTIONS: TriviaQuestion[] = [
  {
    q: "¿Cuál es el río más largo de América del Sur?",
    options: ["Paraná", "Amazonas", "Orinoco", "Magdalena"],
    ok: 1,
  },
  {
    q: "¿En qué ciudad está el Coliseo?",
    options: ["Atenas", "París", "Roma", "Estambul"],
    ok: 2,
  },
  {
    q: "¿Cuántos minutos dura un partido de fútbol reglamentario (sin alargue)?",
    options: ["80", "90", "100", "120"],
    ok: 1,
  },
  {
    q: "¿Qué planeta está más cerca del Sol?",
    options: ["Venus", "Marte", "Mercurio", "Tierra"],
    ok: 2,
  },
  {
    q: "¿Quién pintó la Mona Lisa?",
    options: ["Miguel Ángel", "Van Gogh", "Picasso", "Leonardo da Vinci"],
    ok: 3,
  },
  {
    q: "¿Cuál es la capital de Australia?",
    options: ["Sídney", "Canberra", "Melbourne", "Perth"],
    ok: 1,
  },
  {
    q: "¿En qué año llegó el hombre a la Luna?",
    options: ["1965", "1969", "1972", "1959"],
    ok: 1,
  },
  {
    q: "¿Qué gas respiramos principalmente?",
    options: ["Oxígeno", "Nitrógeno", "CO2", "Helio"],
    ok: 1,
  },
  {
    q: "¿Cuál es el océano más grande?",
    options: ["Atlántico", "Índico", "Pacífico", "Ártico"],
    ok: 2,
  },
  {
    q: "¿Qué instrumento tiene 88 teclas?",
    options: ["Órgano", "Piano", "Acordeón", "Clavicordio"],
    ok: 1,
  },
  {
    q: "¿De qué país es el tango (origen más citado)?",
    options: ["España", "Cuba", "Argentina / Uruguay", "México"],
    ok: 2,
  },
  {
    q: "¿Cuántos lados tiene un hexágono?",
    options: ["5", "6", "7", "8"],
    ok: 1,
  },
  {
    q: "¿Qué animal es el más rápido en tierra?",
    options: ["León", "Guepardo", "Caballo", "Antílope"],
    ok: 1,
  },
  {
    q: "¿Cuál es la montaña más alta del mundo?",
    options: ["K2", "Aconcagua", "Everest", "McKinley"],
    ok: 2,
  },
  {
    q: "¿Quién escribió 'Cien años de soledad'?",
    options: ["Borges", "Vargas Llosa", "García Márquez", "Cortázar"],
    ok: 2,
  },
  {
    q: "¿Qué vitamina produce la piel con el sol?",
    options: ["A", "C", "D", "B12"],
    ok: 2,
  },
  {
    q: "¿Cuál es la moneda de Japón?",
    options: ["Yuan", "Yen", "Won", "Ringgit"],
    ok: 1,
  },
  {
    q: "¿En qué continente está Egipto?",
    options: ["Asia", "Europa", "África", "Oceanía"],
    ok: 2,
  },
  {
    q: "¿Cuántos jugadores hay por equipo en una cancha de básquet?",
    options: ["5", "6", "7", "11"],
    ok: 0,
  },
  {
    q: "¿Qué metal es líquido a temperatura ambiente?",
    options: ["Plomo", "Mercurio", "Sodio", "Aluminio"],
    ok: 1,
  },
  {
    q: "¿Cuál es el hueso más largo del cuerpo humano?",
    options: ["Tibia", "Húmero", "Fémur", "Radio"],
    ok: 2,
  },
  {
    q: "¿Qué país tiene forma de bota?",
    options: ["Grecia", "Italia", "Portugal", "Noruega"],
    ok: 1,
  },
  {
    q: "¿Cómo se llama el temor a los lugares cerrados?",
    options: ["Acrofobia", "Claustrofobia", "Agorafobia", "Hidrofobia"],
    ok: 1,
  },
  {
    q: "¿Qué bebida se hace con uvas fermentadas?",
    options: ["Cerveza", "Sidra", "Vino", "Sake"],
    ok: 2,
  },
  {
    q: "¿Cuántos anillos hay en el logo olímpico?",
    options: ["4", "5", "6", "7"],
    ok: 1,
  },
  {
    q: "¿Cuál es la capital de Canadá?",
    options: ["Toronto", "Vancouver", "Ottawa", "Montreal"],
    ok: 2,
  },
  {
    q: "¿Qué compositor era sordo al final de su vida?",
    options: ["Mozart", "Bach", "Beethoven", "Chopin"],
    ok: 2,
  },
  {
    q: "¿En qué país se originó el sushi?",
    options: ["China", "Corea", "Japón", "Tailandia"],
    ok: 2,
  },
  {
    q: "¿Qué parte del avión genera la mayor parte de la sustentación?",
    options: ["Cola", "Alas", "Fuselaje", "Tren de aterrizaje"],
    ok: 1,
  },
  {
    q: "¿Cómo se llama el aeropuerto de Buenos Aires más cercano al centro?",
    options: ["Ezeiza", "Aeroparque", "Pistarini", "Carrasco"],
    ok: 1,
  },
  {
    q: "¿Qué número sigue en 2, 3, 5, 8, 13, …?",
    options: ["18", "20", "21", "24"],
    ok: 2,
  },
  {
    q: "¿Cuál es el idioma más hablado como lengua nativa?",
    options: ["Inglés", "Mandarín", "Español", "Hindi"],
    ok: 1,
  },
  {
    q: "¿Quién formuló la teoría de la relatividad?",
    options: ["Newton", "Einstein", "Tesla", "Hawking"],
    ok: 1,
  },
  {
    q: "¿Qué color se obtiene mezclando azul y amarillo?",
    options: ["Violeta", "Naranja", "Verde", "Marrón"],
    ok: 2,
  },
  {
    q: "¿En qué país está Machu Picchu?",
    options: ["Bolivia", "Perú", "Ecuador", "Chile"],
    ok: 1,
  },
  {
    q: "¿Cuántos dientes permanentes tiene un adulto (sin muelas del juicio a veces menos, ideal)?",
    options: ["28-32", "20", "24", "36"],
    ok: 0,
  },
];
