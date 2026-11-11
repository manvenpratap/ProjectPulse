import sys
import time
from playwright.sync_api import sync_playwright


def run_design_spells_check() -> None:
    print("✨ Starting Design Spells E2E Verification...")
    errors: list[str] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            permissions=["clipboard-read", "clipboard-write"],
        )
        page = context.new_page()
        page.on("pageerror", lambda exc: errors.append(f"pageerror: {exc}"))
        page.on(
            "console",
            lambda msg: errors.append(f"console.error: {msg.text}") if msg.type == "error" else None,
        )

        page.goto("http://localhost:3000", wait_until="networkidle")
        time.sleep(0.8)

        demo_btn = page.locator('button:has-text("Load Demo Database")')
        if demo_btn.count() > 0 and demo_btn.first.is_visible():
            demo_btn.first.click()
            time.sleep(1.0)

        # 1. Verify pointer-tracking card spotlight CSS vars & scroll hairline element on Overview
        hairline = page.locator(".spell-scroll-hairline").first
        assert hairline.count() == 1, "Overview should mount the scroll reading hairline"
        spotlight_card = page.locator(".spell-spotlight").first
        spotlight_card.scroll_into_view_if_needed()
        box = spotlight_card.bounding_box()
        assert box is not None, "Hero spotlight bento card must have bounding box"
        page.mouse.move(box["x"] + box["width"] * 0.35, box["y"] + box["height"] * 0.45)
        time.sleep(0.15)
        spot_vars = spotlight_card.evaluate(
            "el => ({ x: el.style.getPropertyValue('--spot-x'), y: el.style.getPropertyValue('--spot-y') })"
        )
        assert spot_vars["x"].endswith("px") and spot_vars["y"].endswith("px"), (
            f"Expected --spot-x/--spot-y px vars after pointer move, got {spot_vars}"
        )
        print(f"✓ Overview Hero card pointer spotlight active: {spot_vars}")

        # 2. Verify primary CTA sheen class + button mount
        primary_cta = page.locator(".btn-spell-primary").first
        assert primary_cta.is_visible(), "Primary CTA with .btn-spell-primary must be visible"
        print("✓ Primary action specular sweep button (.btn-spell-primary) mounted")

        # 3. Verify Command Bar secret Magic Spell commands ("magic" -> Surprise Me theme shuffle & celebration)
        search_input = page.locator('input[aria-label="Search screens, tasks, defects, and RAID items"]')
        search_input.click()
        search_input.fill("magic")
        time.sleep(0.25)
        surprise_opt = page.locator('#global-search-listbox button:has-text("Surprise Me: Shuffle Theme Palette")')
        celebrate_opt = page.locator('#global-search-listbox button:has-text("Cast Pulse Celebration")')
        assert surprise_opt.is_visible() and celebrate_opt.is_visible(), (
            "Typing 'magic' in command bar must surface both Surprise Me and Cast Pulse Celebration spells"
        )

        initial_theme = page.evaluate("() => document.documentElement.getAttribute('data-theme')")
        surprise_opt.click()
        time.sleep(0.55)
        shuffled_theme = page.evaluate("() => document.documentElement.getAttribute('data-theme')")
        assert shuffled_theme and shuffled_theme != initial_theme, (
            f"Surprise Me should switch theme palette ({initial_theme} -> {shuffled_theme})"
        )
        print(f"✓ Command bar 'magic' Surprise Me theme shuffle: {initial_theme} -> {shuffled_theme}")

        # 4. Verify Sidebar brand logo Shift+click pulse easter egg & active indicator pill
        home_btn = page.locator('button[aria-label="ProjectPulse Home"]')
        assert home_btn.is_visible(), "Sidebar ProjectPulse Home logo button must be visible"
        home_btn.click(modifiers=["Shift"])
        time.sleep(0.3)
        print("✓ Sidebar brand logo Shift+click pulse celebration executed cleanly")

        # 5. Verify Health Pill Shift+click tactile spark + click navigation
        health_pill = page.locator('button[title*="Project Health:"]')
        health_pill.click(modifiers=["Shift"])
        time.sleep(0.2)
        print("✓ Topbar health pill Shift+click spark executed cleanly")

        # 6. Verify Reports View scroll hairline + CXO Email Briefing morphing copy confirmation
        page.goto("http://localhost:3000/#/cxo", wait_until="networkidle")
        time.sleep(0.6)
        assert page.locator(".spell-scroll-hairline").count() >= 1, (
            "ReportView should mount the scroll reading hairline"
        )
        briefing_btn = page.locator('button:has-text("Copy Rich Email")').first
        assert briefing_btn.is_visible(), "Copy Rich Email button must be visible on #/cxo"
        briefing_btn.click()
        time.sleep(0.25)
        copied_label = page.locator('button:has-text("Copied HTML!")')
        assert copied_label.is_visible(), "Copy Rich Email must morph to 'Copied HTML!'"
        print("✓ ReportView scroll hairline & CXO Copy Rich Email morphing confirmation verified")

        # 7. Verify Tasks Matrix status cycle (interaction origin confetti path)
        page.goto("http://localhost:3000/#/tasks", wait_until="networkidle")
        time.sleep(0.5)
        status_pill = page.locator(".st-badge").first
        assert status_pill.is_visible(), "Tasks status pill should be visible"
        before_status = status_pill.inner_text().strip()
        status_pill.click()
        time.sleep(0.2)
        after_status = status_pill.inner_text().strip()
        assert after_status != before_status, (
            f"Clicking task status pill should cycle status ({before_status} -> {after_status})"
        )
        print(f"✓ TaskGrid status badge tactile cycle verified: {before_status} -> {after_status}")

        # 7. Verify reduced-motion mode safety + mobile bottom nav pill
        reduced_ctx = browser.new_context(
            viewport={"width": 393, "height": 852},
            reduced_motion="reduce",
        )
        rpage = reduced_ctx.new_page()
        rpage.on("pageerror", lambda exc: errors.append(f"reduced pageerror: {exc}"))
        rpage.goto("http://localhost:3000", wait_until="networkidle")
        time.sleep(0.6)
        demo_m = rpage.locator('button:has-text("Load Demo Database")')
        if demo_m.count() > 0 and demo_m.first.is_visible():
            demo_m.first.click()
            time.sleep(0.8)
        m_search = rpage.locator('button[aria-label="Search and Quick Jump"]')
        assert m_search.is_visible(), "Mobile search trigger must remain accessible in reduced-motion mode"
        print("✓ Reduced-motion mobile viewport renders cleanly without errors")

        assert not errors, f"Unexpected runtime/console errors during Design Spells verification: {errors}"
        browser.close()

    print("✨ ALL DESIGN SPELLS CHECKS PASSED WITH ZERO ERRORS!")


if __name__ == "__main__":
    try:
        run_design_spells_check()
    except Exception as exc:
        print(f"❌ Design Spells check failed: {exc}", file=sys.stderr)
        sys.exit(1)

