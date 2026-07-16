import quizData from '../../data/quiz_biblique.json'

// Validation des données en dev : signale les questions dont le nombre annoncé
// de bonnes réponses ne correspond pas à la liste des indices corrects.
if (import.meta.env.DEV) {
  for (const q of quizData.questions) {
    if (q.reponses_correctes.length !== q.nombre_bonnes_reponses) {
      console.warn(
        `Incohérence de données pour ${q.id} : ${q.reponses_correctes.length} indice(s) correct(s) mais nombre_bonnes_reponses = ${q.nombre_bonnes_reponses}`,
      )
    }
    if (new Set(q.options).size !== q.options.length) {
      console.warn(`Options en double pour ${q.id}`)
    }
    if (q.reponses_correctes.some((i) => i < 0 || i >= q.options.length)) {
      console.warn(`Indice de bonne réponse hors limites pour ${q.id}`)
    }
  }
}

// Liste des livres dans l'ordre du fichier (ordre biblique), avec le nombre de questions.
// Map préserve l'ordre d'insertion, donc l'ordre biblique est conservé.
export function getBooks() {
  const counts = new Map()
  for (const q of quizData.questions) {
    counts.set(q.livre, (counts.get(q.livre) ?? 0) + 1)
  }
  return [...counts].map(([livre, count]) => ({ livre, count }))
}

// Mélange de Fisher–Yates (copie, sans muter l'original).
function shuffle(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Tire jusqu'à `n` questions au hasard dans un livre, en mélangeant aussi
// les options de chaque question (avec remappage des bonnes réponses).
export function pickQuestions(livre, n = 10) {
  const pool = quizData.questions.filter((q) => q.livre === livre)
  const selected = shuffle(pool).slice(0, Math.min(n, pool.length))

  return selected.map((q) => {
    const order = shuffle(q.options.map((_, i) => i))
    return {
      ...q,
      options: order.map((i) => q.options[i]),
      reponses_correctes: q.reponses_correctes
        .map((orig) => order.indexOf(orig))
        .sort((a, b) => a - b),
    }
  })
}
