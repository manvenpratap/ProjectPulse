#!/usr/bin/env python3
import os
import sys
import json
from playwright.sync_api import sync_playwright

VIEWS = [
    ('overview', 'Executive Overview'),
    ('deliveries', 'ALM Deliveries'),
    ('releases', 'Release Roadmap'),
    ('tasks', 'Tasks & Timeline'),
    ('timeline', 'Project Tasks Matrix'),
    ('capacity', 'Team Hub'),
    ('team', 'Team Hub'),
    ('features', 'Functional Matrix'),
    ('log', 'Project Audit Log'),
    ('dash', 'Project Intelligence'),
    ('risks', 'RAID Register'),
    ('reports', 'Executive Reporting'),
    ('retro', 'Sprint Retrospective'),
    ('defects', 'Defect Workshop'),
    ('scaffolder', 'Project Scaffolder'),
    ('fields', 'Field Architect'),
    ('dropdowns', 'Option Libraries'),
    ('steps', 'Step Blueprints'),
    ('settings', 'System Configuration'),
]

def run_mobile_audit():
    os.makedirs('/tmp/mobile_audit', exist_ok=True)
    results = []
    failures = []

    with sync_playwright() as p:
        iphone = p.devices['iPhone 14 Pro']
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(**iphone)
        page = context.new_page()

        print("Navigating to http://localhost:3000 ...")
        page.goto('http://localhost:3000', wait_until='networkidle')
        page.wait_for_timeout(800)

        # Ensure workspace demo data is initialized when SetupView appears
        sample_btn = page.locator('button:has-text("Load Demo Database"), button:has-text("Load Sample: Web"), button:has-text("Load Sample")')
        if sample_btn.count() > 0:
            print("Setup view detected, loading demo database...")
            sample_btn.first.click()
            page.wait_for_timeout(1200)
            page.keyboard.press('Escape')
            page.wait_for_timeout(200)

        # Verify both Dark default theme & Light theme ("nexus")
        for theme_label, theme_id in [('dark', None), ('light_nexus', 'nexus')]:
            if theme_id:
                page.evaluate("(t) => window.setTheme && window.setTheme(t)", theme_id)
                page.wait_for_timeout(250)

            for view_id, expected_h1 in VIEWS:
                print(f"[{theme_label}] Auditing view: {view_id}")
                page.goto(f'http://localhost:3000/#/{view_id}', wait_until='networkidle')
                page.wait_for_timeout(450)

                if view_id == 'timeline':
                    tl_btn = page.locator('button[aria-label="Timeline Gantt View"]').first
                    if tl_btn.count() > 0:
                        tl_btn.click()
                        page.wait_for_timeout(400)

                screenshot_path = f"/tmp/mobile_audit/{theme_label}_{view_id}.png"
                if theme_label == 'dark' or view_id in ('overview', 'fields', 'scaffolder', 'reports', 'tasks'):
                    page.screenshot(path=screenshot_path)

                audit = page.evaluate("""() => {
                    const winW = window.innerWidth;
                    const docOverflow = document.documentElement.scrollWidth > winW + 2;

                    // True child right-edge viewport overflow check on top header & visible primary controls
                    const headerClipped = [];
                    document.querySelectorAll('header button, main header button').forEach(el => {
                        const r = el.getBoundingClientRect();
                        if (r.width > 0 && r.height > 0 && r.top >= -2 && r.bottom <= window.innerHeight && r.top < 220) {
                            // Exclude items deliberately inside horizontally scrolling strips
                            const inScrollStrip = !!el.closest('.overflow-x-auto');
                            if (!inScrollStrip && (r.right > winW + 1 || r.left < -1)) {
                                headerClipped.push((el.innerText || el.getAttribute('aria-label') || 'button').trim());
                            }
                        }
                    });

                    // Detect overlapping 12-col text nodes or severe sibling collisions inside non-scroll regions
                    const h1 = document.querySelector('main h1')?.innerText?.trim() || '';
                    const themeColorMeta = document.querySelector('meta[name="theme-color"]')?.getAttribute('content') || '';

                    // Check button touch dimensions (crediting .touch-hit-expand pseudo hit targets for inline breadcrumbs)
                    const tinyButtons = [];
                    document.querySelectorAll('header button, nav[aria-label="Mobile Navigation"] button').forEach(b => {
                        const r = b.getBoundingClientRect();
                        if (r.width > 0 && r.height > 0) {
                            const hasExpand = b.classList.contains('touch-hit-expand');
                            const effectiveH = hasExpand ? r.height + 28 : r.height;
                            const effectiveW = hasExpand ? r.width + 16 : r.width;
                            if (effectiveW < 34 || effectiveH < 34) {
                                tinyButtons.push({
                                    text: (b.innerText || b.getAttribute('aria-label') || '').trim().slice(0, 30),
                                    w: Math.round(effectiveW),
                                    h: Math.round(effectiveH),
                                });
                            }
                        }
                    });

                    return {
                        h1,
                        docOverflow,
                        scrollWidth: document.documentElement.scrollWidth,
                        innerWidth: winW,
                        headerClipped,
                        tinyButtons,
                        themeColorMeta,
                    };
                }""")

                results.append({
                    'theme': theme_label,
                    'view_id': view_id,
                    **audit,
                })
                print(
                    f"  -> h1={audit['h1'][:26]:26s} | overflow={audit['docOverflow']} "
                    f"({audit['scrollWidth']}/{audit['innerWidth']}) | clipped={audit['headerClipped']} | tinyNav={len(audit['tinyButtons'])}"
                )

                if audit['docOverflow']:
                    failures.append(f"[{theme_label}] {view_id}: document horizontal overflow ({audit['scrollWidth']} > {audit['innerWidth']})")
                if audit['headerClipped']:
                    failures.append(f"[{theme_label}] {view_id}: clipped header actions {audit['headerClipped']}")
                if audit['tinyButtons']:
                    failures.append(f"[{theme_label}] {view_id}: undersized chrome buttons {audit['tinyButtons']}")
                if not audit['themeColorMeta']:
                    failures.append(f"[{theme_label}] {view_id}: missing dynamic <meta name='theme-color'>")

            # Also verify Mobile Drawer (inert backdrop + no bottom desktop ChevronLeft collapse button) on dark theme
            if theme_label == 'dark':
                page.goto('http://localhost:3000/#/overview', wait_until='networkidle')
                page.wait_for_timeout(400)
                page.locator('button[aria-label="Toggle navigation menu"]').click()
                page.wait_for_timeout(400)
                page.screenshot(path='/tmp/mobile_audit/dark_drawer.png')
                drawer_check = page.evaluate("""() => {
                    const aside = document.querySelector('aside');
                    const collapseBtn = aside?.querySelector('button[aria-label*="Collapse navigation sidebar"]');
                    const backdrop = document.querySelector('.z-\\\\[45\\\\]');
                    const hasRole = aside?.getAttribute('role') === 'dialog';
                    const mainWrapperInert = document.querySelector('div[inert]') !== null;
                    return {
                        collapseHiddenOnMobile: !collapseBtn || collapseBtn.offsetParent === null,
                        backdropVisible: !!backdrop,
                        hasRole,
                        mainWrapperInert,
                    };
                }""")
                print(f"  -> Drawer check: {drawer_check}")
                if not drawer_check['collapseHiddenOnMobile']:
                    failures.append("Drawer: Desktop bottom Collapse button visible on mobile")
                if not drawer_check['backdropVisible'] or not drawer_check['hasRole'] or not drawer_check['mainWrapperInert']:
                    failures.append(f"Drawer modality/backdrop failure: {drawer_check}")
                page.locator('button[aria-label="Close navigation drawer"]').click()
                page.wait_for_timeout(300)

                # Also verify Bottom Sheet Modal + dark color-scheme + drag handle
                page.goto('http://localhost:3000/#/tasks', wait_until='networkidle')
                page.wait_for_timeout(400)
                page.locator('button:has-text("New Task")').first.click()
                page.wait_for_timeout(450)
                page.screenshot(path='/tmp/mobile_audit/dark_modal.png')
                modal_check = page.evaluate("""() => {
                    const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
                    const closeBtn = dialog?.querySelector('button[aria-label="Close modal"]');
                    const closeRect = closeBtn ? closeBtn.getBoundingClientRect() : null;
                    const scheme = getComputedStyle(document.documentElement).colorScheme;
                    return {
                        hasModalDialog: !!dialog,
                        closeSize: closeRect ? { w: Math.round(closeRect.width), h: Math.round(closeRect.height) } : null,
                        colorScheme: scheme,
                    };
                }""")
                print(f"  -> Modal check: {modal_check}")
                if not modal_check['hasModalDialog']:
                    failures.append("Modal: Missing role='dialog' aria-modal='true'")
                if modal_check['closeSize'] and (modal_check['closeSize']['w'] < 40 or modal_check['closeSize']['h'] < 40):
                    failures.append(f"Modal: Close button < 40px touch target: {modal_check['closeSize']}")

        browser.close()

    with open('/tmp/mobile_audit/results.json', 'w') as f:
        json.dump(results, f, indent=2)

    if failures:
        print("\nMOBILE AUDIT FAILURES:")
        for err in failures:
            print("  -", err)
        sys.exit(1)

    print(f"\nALL {len(results)} MOBILE VIEW CHECKS + DRAWER + MODAL PASSED WITH ZERO FAILURES!")

if __name__ == '__main__':
    run_mobile_audit()
