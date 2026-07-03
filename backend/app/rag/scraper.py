# backend/app/rag/scraper.py
import re
import requests
from bs4 import BeautifulSoup
from app.rag.log import logger


class WebScraper:
    """A helper class to extract clean text content from static and dynamic websites."""

    def __init__(self):
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        }

    def scrape_static(self, url: str) -> str:
        """Scrapes standard server-rendered HTML websites using requests and BeautifulSoup."""
        try:
            logger.info(f"Starting static web scrape for URL: {url}")
            response = requests.get(url, headers=self.headers, timeout=15)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")
            return self._clean_html(soup)
        except Exception as e:
            logger.error(f"Static scraping failed for {url}: {e}")
            raise Exception(f"Static scraping failed: {str(e)}")

    def scrape_dynamic(self, url: str) -> str:
        """Scrapes client-side JavaScript-rendered websites using Playwright (with static fallback)."""
        try:
            logger.info(f"Starting dynamic web scrape (browser-rendering) for URL: {url}")
            from playwright.sync_api import sync_playwright

            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.goto(url, wait_until="networkidle", timeout=30000)
                content = page.content()
                browser.close()

            soup = BeautifulSoup(content, "html.parser")
            return self._clean_html(soup)
        except ImportError:
            logger.warning("Playwright package not installed. Falling back to static scraping.")
            return self.scrape_static(url)
        except Exception as e:
            logger.error(f"Dynamic scraping failed for {url}: {e}")
            raise Exception(f"Dynamic rendering scrape failed: {str(e)}")

    def _clean_html(self, soup: BeautifulSoup) -> str:
        """Strips out script/style elements and cleans up raw textual content."""
        # Remove script, style, header, footer, and navigation to focus on core text content
        for element in soup(["script", "style", "nav", "footer", "header"]):
            element.decompose()

        text = soup.get_text(separator="\n")
        # Standardize spacing and strip empty lines
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        cleaned_text = "\n".join(chunk for chunk in chunks if chunk)
        return cleaned_text