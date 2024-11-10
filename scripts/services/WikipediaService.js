export class WikipediaService {
    static async fetchImage(airportName) {
        try {
            const response = await fetch(
                `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(airportName)}&prop=pageimages&pithumbsize=300&format=json&origin=*`
            );
            const data = await response.json();
            const pages = data.query.pages;
            const page = Object.values(pages)[0];
            return page?.thumbnail?.source || './assets/airport_placeholder.png';
        } catch (error) {
            console.error('Error fetching Wikipedia image:', error);
            return './assets/airport_placeholder.png';
        }
    }
}