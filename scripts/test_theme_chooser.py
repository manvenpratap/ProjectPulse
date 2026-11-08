import time
import sys
from playwright.sync_api import sync_playwright

def test_theme_chooser():
    print("🚀 Starting Theme Chooser E2E Test...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # Test 1: Desktop Viewport
        print("\n--- Desktop Viewport (1280x800) ---")
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()
        page.goto("http://localhost:3000", wait_until="networkidle")
        time.sleep(1)

        # Find theme palette button in topbar
        palette_btn = page.locator('button[aria-label="Appearance and Theme Settings"]')
        assert palette_btn.is_visible(), "Theme palette button must be visible in Topbar"
        palette_btn.click()
        time.sleep(0.5)

        # Verify Theme Flyout opens
        flyout_title = page.locator('text=System Aesthetics & Themes')
        assert flyout_title.is_visible(), "Theme flyout header must be visible"
        print("✓ Theme Flyout drawer opened successfully")

        # Verify Now Playing card exists
        now_playing = page.locator('text=Now active:')
        assert now_playing.is_visible(), "Active theme indicator must be visible"
        print("✓ 'Now Playing' active indicator is visible")

        # Test Filter Pills
        for filter_name in ['Featured', 'Light', 'Dark', 'Classic', 'All']:
            btn = page.locator(f'button:has-text("{filter_name}")').first
            assert btn.is_visible(), f"Filter pill '{filter_name}' should be visible"
            btn.click()
            time.sleep(0.2)
            print(f"✓ Clicked '{filter_name}' filter pill")

        # Test Search Box
        search_input = page.locator('input[placeholder*="Search themes"]')
        assert search_input.is_visible(), "Search input should be visible"
        search_input.fill("nova")
        time.sleep(0.3)
        
        # Verify Nova appears
        nova_card = page.locator('div[role="button"]:has-text("Nova")').first
        assert nova_card.is_visible(), "Nova theme card should appear in search results"
        print("✓ Search for 'nova' returned Nova theme")

        # Click Nova theme card
        nova_card.click()
        time.sleep(0.3)
        current_theme = page.evaluate("document.documentElement.getAttribute('data-theme')")
        assert current_theme == "nova", f"Expected data-theme to be 'nova', got '{current_theme}'"
        print("✓ Theme successfully changed to 'nova'")

        # Clear search
        search_input.fill("")
        time.sleep(0.3)

        # Test Light / Dark Mode Toggle
        dark_btn = page.locator('button:has-text("🌙 Dark Mode")')
        light_btn = page.locator('button:has-text("☀️ Light Mode")')
        assert dark_btn.is_visible() and light_btn.is_visible(), "Light and Dark mode buttons must be visible"

        dark_btn.click()
        time.sleep(0.3)
        color_mode = page.evaluate("document.documentElement.getAttribute('data-color-mode')")
        assert color_mode == "dark", f"Expected data-color-mode to be 'dark', got '{color_mode}'"
        print("✓ Color mode successfully switched to 'dark'")

        light_btn.click()
        time.sleep(0.3)
        color_mode = page.evaluate("document.documentElement.getAttribute('data-color-mode')")
        assert color_mode == "light", f"Expected data-color-mode to be 'light', got '{color_mode}'"
        print("✓ Color mode successfully switched to 'light'")

        # Test selecting Terminal theme
        terminal_card = page.locator('div[role="button"]:has-text("Terminal")').first
        if terminal_card.is_visible():
            terminal_card.click()
            time.sleep(0.3)
            current_theme = page.evaluate("document.documentElement.getAttribute('data-theme')")
            assert current_theme == "terminal", f"Expected 'terminal', got '{current_theme}'"
            print("✓ Theme changed to 'terminal'")

        # Close Flyout via 'Seal Configuration'
        seal_btn = page.locator('button:has-text("Seal Configuration")')
        seal_btn.click()
        time.sleep(0.5)
        print("✓ Flyout closed via 'Seal Configuration'")

        # Test 2: Mobile Viewport
        print("\n--- Mobile Viewport (390x844) ---")
        mobile_ctx = browser.new_context(viewport={"width": 390, "height": 844})
        m_page = mobile_ctx.new_page()
        m_page.goto("http://localhost:3000", wait_until="networkidle")
        time.sleep(1)

        m_palette = m_page.locator('button[aria-label="Appearance and Theme Settings"]')
        assert m_palette.is_visible(), "Palette button should be visible on mobile"
        m_palette.click()
        time.sleep(0.5)

        m_flyout = m_page.locator('text=System Aesthetics & Themes')
        assert m_flyout.is_visible(), "Flyout should open on mobile"
        print("✓ Theme Flyout opens cleanly on mobile viewport")

        # Select Aurora
        aurora_card = m_page.locator('div[role="button"]:has-text("Aurora")').first
        assert aurora_card.is_visible(), "Aurora card should be visible on mobile"
        aurora_card.click()
        time.sleep(0.3)
        m_theme = m_page.evaluate("document.documentElement.getAttribute('data-theme')")
        assert 'aurora' in m_theme, f"Expected aurora theme, got {m_theme}"
        print(f"✓ Successfully selected theme on mobile: {m_theme}")

        # Close on mobile
        m_close = m_page.locator('button[aria-label="Close theme studio"]')
        m_close.click()
        time.sleep(0.5)
        print("✓ Closed flyout on mobile")

        browser.close()
        print("\n🎉 ALL THEME CHOOSER TESTS PASSED!")

if __name__ == "__main__":
    test_theme_chooser()
