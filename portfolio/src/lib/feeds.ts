// src/lib/feeds.ts
import Parser from 'rss-parser'

export interface AlertItem {
  id: string
  title: string
  link: string
  date: string
  summary: string
}

const parser = new Parser()

async function fetchRssFeed(url: string, limit: number, fallbackTitle: string): Promise<AlertItem[]> {
  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }
    })

    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`)

    const xmlData = await response.text()
    const feed = await parser.parseString(xmlData)

    const sortedItems = feed.items.sort((a, b) => {
      return new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime()
    })

    return sortedItems.slice(0, limit).map((item) => ({
      id: item.guid || item.link || Math.random().toString(),
      title: item.title || fallbackTitle,
      link: item.link || '#',
      date: item.pubDate ? new Date(item.pubDate).toLocaleDateString('fr-FR') : 'Date inconnue',
      summary: item.contentSnippet || '',
    }))

  } catch (error) {
    console.error(`Erreur lors de la récupération du flux ${url} :`, error)
    return []
  }
}

export function getAnssiAlerts(): Promise<AlertItem[]> {
  return fetchRssFeed('https://www.cert.ssi.gouv.fr/alerte/feed/', 8, 'Alerte inconnue')
}

export function getTheRecordFeed(): Promise<AlertItem[]> {
  return fetchRssFeed('https://therecord.media/feed/', 8, 'Article inconnu')
}

export function getIcsCertFeed(): Promise<AlertItem[]> {
  return fetchRssFeed('https://www.cisa.gov/cybersecurity-advisories/ics-advisories.xml', 8, 'Avis ICS inconnu')
}

export async function getGeopoliticsFeed(): Promise<AlertItem[]> {
  // Recherche Google News RSS ciblée "géopolitique" et "cyber"
  const GEO_FEED_URL = 'https://news.google.com/rss/search?q=cybersecurite+geopolitique+OR+cyberattaque&hl=fr&gl=FR&ceid=FR:fr'

  try {
    const response = await fetch(GEO_FEED_URL, {
      next: { revalidate: 3600 }
    })

    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`)

    const xmlData = await response.text()
    const feed = await parser.parseString(xmlData)

    const sortedItems = feed.items.sort((a, b) => {
      return new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime()
    })

    return sortedItems.slice(0, 7).map((item) => {
      // Nettoyage du titre (Google News ajoute souvent " - Nom du journal" à la fin)
      const cleanTitle = item.title?.split(' - ')[0] || 'Article inconnu';
      const source = item.title?.split(' - ')[1] || item.source || '';

      return {
        id: item.guid || item.link || Math.random().toString(),
        title: cleanTitle,
        link: item.link || '#',
        date: item.pubDate ? new Date(item.pubDate).toLocaleDateString('fr-FR') : '',
        summary: source, // On détourne 'summary' pour afficher la source (ex: Le Monde, Courrier International)
      }
    })

  } catch (error) {
    console.error("Erreur flux Géopolitique :", error)
    return []
  }
}
