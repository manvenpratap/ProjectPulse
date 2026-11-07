#!/usr/bin/env python3
import time
import json
from playwright.sync_api import sync_playwright

VIEWS = [
    ('overview', 'Executive Overview'),
    ('deliveries', 'ALM Deliveries'),
    ('releases', 'Release Roadmap'),
    ('tasks', 'Tasks Matrix'),
    ('timeline', 'Project Timeline'),
    ('capacity', 'Capacity Plan'),
    ('team', 'Team Hub'),
    ('features', 'Functional Matrix'),
    ('log', 'Activity Log'),
    ('dash', 'Intelligence'),
    ('scheduler', 'Intelligent Scheduler'),
    ('risks', 'RAID Register'),
    ('reports', 'Pulse Reports'),
    ('retro', 'Sprint Retrospective'),
    ('defects', 'Defect Workshop'),
    ('scaffolder', 'Project Architect'),
    ('fields', 'Field Architect'),
    ('dropdowns', 'Pulse Registry'),
    ('steps', 'Step Templates'),
    ('settings', 'Configuration'),
]

def run_mobile_audit():
    results = []
    with sync_playwright() as p:
        iphone = p.devices['iPhone 14 Pro']
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            **iphone
        )
        page = context.new_page()

        print("Navigating to http://localhost:3000 ...")
        page.goto('http://localhost:3000', wait_until='networkidle')
        page.wait_for_timeout(1000)

        # Ensure project is setup
        # If SetupView is displayed, click "Load Sample Project" or initialize
        if page.locator('text=Welcome to ProjectPulse').count() > 0 or page.locator('text=Initialize').count() > 0:
            print("Setup view detected, initializing workspace...")
            sample_btn = page.locator('button:has-text("Load Demo Project"), button:has-text("Load Sample"), button:has-text("Get Started")')
            if sample_btn.count() > 0:
                sample_btn.first.click()
                page.wait_for_timeout(1000)

        for view_id, label in VIEWS:
            print(f"Auditing view: {view_id} ({label})")
            
            # Navigate to the view via sidebar or bottom nav
            # First try bottom nav if it exists for this view
            bottom_btn = page.locator(f'nav[aria-label="Mobile Navigation"] button[aria-label*="{label}" i], nav[aria-label="Mobile Navigation"] button:has-text("{label}")')
            
            if bottom_btn.count() > 0:
                bottom_btn.first.click()
            else:
                # Open menu drawer
                menu_btn = page.locator('nav[aria-label="Mobile Navigation"] button:has-text("Hubs"), nav[aria-label="Mobile Navigation"] button:has-text("Menu"), button[aria-label="Toggle navigation menu"], button[aria-label="More navigation options"]')
                if menu_btn.count() > 0:
                    menu_btn.first.click()
                    page.wait_for_timeout(300)
                
                # Click the item in the sidebar
                nav_item = page.locator(f'div.custom-scroll button:has-text("{label}")')
                if nav_item.count() > 0:
                    nav_item.first.click()
                else:
                    print(f"Warning: could not find button for {label}, trying fallback selector")
                    fallback = page.locator(f'button:has-text("{label}")')
                    if fallback.count() > 0:
                        fallback.first.click()

            page.wait_for_timeout(600)

            # Take screenshot
            screenshot_path = f"/tmp/mobile_audit/{view_id}.png"
            page.screenshot(path=screenshot_path)

            # Check for horizontal overflow
            body_overflow = page.evaluate("""() => {
                const el = document.querySelector('main > div > div') || document.querySelector('main');
                const scrollW = el ? el.scrollWidth : document.body.scrollWidth;
                const clientW = el ? el.clientWidth : window.innerWidth;
                return {
                    scrollWidth: scrollW,
                    clientWidth: clientW,
                    hasOverflow: scrollW > clientW + 2
                };
            }""")

            # Check buttons minimum touch target size
            undersized_buttons = page.evaluate("""() => {
                const buttons = Array.from(document.querySelectorAll('button:not([aria-hidden="true"])'));
                const bad = [];
                for (const b of buttons) {
                    const rect = b.getBoundingClientRect();
                    // only visible buttons
                    if (rect.width > 0 && rect.height > 0 && (rect.top < window.innerHeight && rect.bottom > 0)) {
                        if (rect.width < 32 || rect.height < 32) {
                            bad.push({
                                text: (b.innerText || b.getAttribute('aria-label') || '').slice(0, 30),
                                width: Math.round(rect.width),
                                height: Math.round(rect.height)
                            });
                        }
                    }
                }
                return bad.slice(0, 5);
            }""")

            results.append({
                'view_id': view_id,
                'label': label,
                'overflow': body_overflow,
                'undersized_buttons': undersized_buttons,
                'screenshot': screenshot_path
            })
            print(f"  -> Overflow: {body_overflow['hasOverflow']} (scrollW={body_overflow['scrollWidth']}, clientW={body_overflow['clientWidth']}), Undersized btns: {len(undersized_buttons)}")

        browser.close()

    print("\nAudit complete! Writing report...")
    with open('/tmp/mobile_audit/results.json', 'w') as f:
        json.dump(results, f, indent=2)

if __name__ == '__main__':
    run_mobile_audit()
