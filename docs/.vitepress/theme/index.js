import DefaultTheme from 'vitepress/theme'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    if (typeof window !== 'undefined') {
      // Mouse tracking for spotlight effect on cards
      window.addEventListener('mousemove', (e) => {
        const cards = document.querySelectorAll('.VPFeature')
        for (const card of cards) {
          const rect = card.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top
          card.style.setProperty('--mouse-x', `${x}px`)
          card.style.setProperty('--mouse-y', `${y}px`)
        }
      })
    }
  }
}