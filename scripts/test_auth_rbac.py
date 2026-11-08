import asyncio
from playwright.async_api import async_playwright

async def run_auth_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Desktop context
        page = await browser.new_page(viewport={"width": 1280, "height": 800})
        
        print("\n--- TEST 1: Initial Launch as Default Admin ---")
        await page.goto("http://localhost:3000")
        await page.wait_for_selector("text=Executive Steering & Health Index", timeout=10000)
        
        # Verify Topbar contains the user avatar & Admin badge
        user_btn = page.locator("button[aria-label='User Account and Access Controls']")
        await user_btn.wait_for(state="visible", timeout=5000)
        print("✓ Topbar profile button is visible with Sarah / Admin")
        
        # Click user profile button to open flyout
        await user_btn.click()
        await page.wait_for_selector("text=Sarah Chen", timeout=3000)
        await page.wait_for_selector("text=Switch Active Persona", timeout=3000)
        print("✓ User profile flyout displays Sarah Chen with persona switcher")
        
        print("\n--- TEST 2: Persona Switching & Role-Based Access Restriction ---")
        # Click Marcus (Developer) in quick switch inside flyout
        dev_switch_btn = page.locator("button:has-text('Marcus')").first
        await dev_switch_btn.click()
        await page.wait_for_timeout(500)
        
        # Check Topbar badge now says 'Developer'
        dev_badge = page.locator("text=Developer").first
        await dev_badge.wait_for(state="visible")
        print("✓ Switched to Marcus Vance (Developer)")
        
        # Click Configuration hub in sidebar (restricted for Developer role)
        config_nav = page.locator("button[aria-label='Configuration']").first
        await config_nav.click()
        await page.wait_for_timeout(800)
        
        # Check if Access Restricted is rendered
        await page.wait_for_selector("text=Access Restricted", timeout=5000)
        await page.wait_for_selector("text=You are signed in as Marcus Vance with the Developer role", timeout=5000)
        print("✓ AccessDenied guard successfully intercepted unauthorized access to settings!")
        
        # Verify the "Switch to Admin (Sarah)" button is present on AccessDenied
        switch_admin_btn = page.locator("button:has-text('Switch to Admin')")
        await switch_admin_btn.wait_for(state="visible")
        print("✓ AccessDenied view contains 1-click admin elevation switcher")
        
        # Click "Return to Overview"
        return_btn = page.locator("button:has-text('Return to Overview')")
        await return_btn.click()
        await page.wait_for_timeout(500)
        await page.wait_for_selector("text=Executive Steering & Health Index", timeout=3000)
        print("✓ Successfully returned to Overview")
        
        print("\n--- TEST 3: Admin Elevation & Access Governance Studio ---")
        # Elevate to Admin Sarah Chen via Topbar flyout
        await user_btn.click()
        admin_switch_btn = page.locator("button:has-text('Sarah')").first
        await admin_switch_btn.click()
        await page.wait_for_timeout(500)
        
        # Open Access Manager Modal via Topbar flyout
        await user_btn.click()
        access_studio_btn = page.locator("button:has-text('Provide Access & Roles')")
        await access_studio_btn.click()
        
        # Verify Modal opened
        await page.wait_for_selector("text=Role & Access Governance", timeout=3000)
        print("✓ Access & Permissions Governance Studio opened successfully")
        
        # Check tabs: Users, Capabilities Matrix, Add User
        await page.click("button:has-text('Role Capabilities Matrix')")
        await page.wait_for_selector("text=Administer role-level capability policies", timeout=3000)
        print("✓ Role Capabilities Matrix tab verified")
        
        await page.click("button:has-text('Add User')")
        await page.wait_for_selector("text=Enroll New Team Member", timeout=3000)
        print("✓ Enroll New User form verified")
        
        # Fill new user form
        await page.fill("input[placeholder='e.g. Jordan Miller']", "Taylor Brooks")
        await page.fill("input[placeholder='jordan.miller@projectpulse.io']", "taylor@pulse.local")
        await page.fill("input[placeholder='e.g. QA Automation Lead']", "Quality Assurance Lead")
        await page.click("button:has-text('Enroll User & Grant Access')")
        await page.wait_for_timeout(500)
        
        # Check newly created user is in user list
        await page.wait_for_selector("text=Taylor Brooks", timeout=3000)
        print("✓ Successfully enrolled new user 'Taylor Brooks'!")
        
        # Close modal
        done_btn = page.locator("button:has-text('Done')").first
        await done_btn.click()
        await page.wait_for_timeout(500)
        print("✓ Governance Studio closed cleanly")
        
        print("\n--- TEST 4: Logout & Full Login Screen Experience ---")
        await user_btn.click()
        sign_out_btn = page.locator("button:has-text('Sign Out')")
        await sign_out_btn.click()
        await page.wait_for_timeout(500)
        
        # Verify LoginView is now displayed
        await page.wait_for_selector("text=Enterprise ALM & Strategic Delivery Engine", timeout=3000)
        await page.wait_for_selector("text=Quick Demo Personas", timeout=3000)
        print("✓ Sign out succeeded: LoginView rendered with persona selector")
        
        # Test Quick Persona Login
        quick_admin_pill = page.locator("button:has-text('Sarah Chen')").first
        await quick_admin_pill.click()
        await page.wait_for_timeout(800)
        
        # Check workspace is restored
        await page.wait_for_selector("text=Executive Steering & Health Index", timeout=5000)
        print("✓ Persona quick login succeeded: Workspace restored!")
        
        print("\n--- TEST 5: Settings Roles & Access Tab ---")
        # Navigate to Settings via sidebar
        config_btn = page.locator("button[aria-label='Configuration']").first
        await config_btn.click()
        await page.wait_for_timeout(500)
        
        # Click Roles & Access tab
        access_tab = page.locator("button:has-text('Access')").first
        await access_tab.click()
        await page.wait_for_timeout(500)
        await page.wait_for_selector("text=Role-Based Access Control (RBAC) Governance", timeout=3000)
        print("✓ Settings Roles & Access tab renders RBAC governance cards")
        
        print("\n==========================================")
        print("ALL AUTH & ACCESS CONTROL TESTS PASSED! 🎉")
        print("==========================================\n")
        
        await browser.close()

asyncio.run(run_auth_verification())
