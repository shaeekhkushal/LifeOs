# LIFEOS — PERSONAL LIFE OPERATING SYSTEM
## AUTONOMOUS WEB APPLICATION BUILD PROMPT

You are an autonomous senior full-stack product engineer, UI/UX designer, database architect, data analyst, and QA engineer.

Your job is to BUILD AND RUN a real web application called:

# LIFEOS

Do NOT create an Excel file.
Do NOT create a Google Sheet.
Do NOT create a spreadsheet-based solution.

The final product must be a real, interactive, browser-based web application with:

- pages
- navigation
- buttons
- forms
- modals
- dropdowns
- checkboxes
- tables
- cards
- charts
- filters
- database persistence
- authentication
- responsive design

I should be able to open the application in a browser and use it like a normal SaaS product.

---

# 1. PRODUCT VISION

LifeOS is a personal operating system for managing and analyzing everyday life.

It combines:

- Finance
- Health
- Sleep
- Medication
- Fitness
- Habits
- Tasks
- Productivity
- Goals
- Learning
- Career
- Travel
- Shopping
- Vehicle
- Home
- Entertainment
- Events
- Journal

The core idea is:

INPUT → DATABASE → CALCULATIONS → ANALYTICS → DASHBOARD

Users enter information through the UI.

The application stores the information in a database.

The application automatically calculates statistics and displays them through dashboards and visualizations.

Do not create disconnected CRUD pages.

The modules must be connected.

Example:

Add expense
→ transaction saved
→ monthly expense updated
→ category spending updated
→ budget utilization updated
→ savings updated
→ finance dashboard updated
→ home dashboard updated.

---

# 2. PRODUCT PRIORITY

Prioritize:

1. Excellent UX
2. Correct data model
3. Working functionality
4. Useful analytics
5. Responsive design
6. Maintainable code
7. Security
8. Performance

Avoid unnecessary features and unnecessary complexity.

---

# 3. TECHNOLOGY

Use a modern TypeScript stack.

Preferred:

Frontend:
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend:
- Next.js server/API architecture

Database:
- PostgreSQL
- Supabase preferred

Authentication:
- Supabase Auth

Validation:
- Zod

Forms:
- React Hook Form

Charts:
- Recharts

Icons:
- Lucide

Use the existing repository conventions when available.

Do not introduce unnecessary libraries.

---

# 4. IMPORTANT EXECUTION RULE

You are an IMPLEMENTATION AGENT, not a consultant.

Do not spend most of the response explaining code.

Actually:

- inspect the repository
- create the project
- install dependencies
- create files
- create database schema
- create migrations
- build UI
- build APIs/server actions
- run the application
- run tests
- fix errors
- iterate

The final result must be executable.

Do not merely output code snippets for me to copy manually.

---

# 5. APPLICATION EXPERIENCE

The application should feel like a polished personal SaaS platform.

Main layout:

SIDEBAR
+
TOP BAR
+
MAIN CONTENT

Desktop:

Fixed/collapsible sidebar.

Mobile:

Responsive drawer or bottom navigation.

Top bar should contain:

- page title
- global search
- notifications
- profile
- theme toggle

---

# 6. GLOBAL NAVIGATION

Create these navigation items:

🏠 Home

💰 Finance

❤️ Health

✅ Habits

📋 Productivity

🎯 Goals

📚 Learning

💼 Career

✈️ Travel

🛍 Shopping

🚗 Vehicle

🏠 Home Management

🎬 Entertainment

📅 Calendar

📊 Reports

⚙ Settings

Group navigation logically when appropriate.

---

# 7. HOME DASHBOARD

Home is the command center.

It must answer:

"What is happening in my life right now?"

Display:

## Overview

- Current Balance
- Monthly Income
- Monthly Expenses
- Monthly Savings
- Net Worth
- Life Score

## Today

- Tasks
- Habits
- Sleep
- Exercise
- Spending
- Events

## Progress

- Habit completion
- Goal progress
- Savings progress
- Learning progress

## Upcoming

- Bills
- Events
- Goal deadlines
- Subscription renewals
- Tasks

## Charts

Use only useful charts.

Examples:

- Income vs expense
- Savings trend
- Habit progress
- Sleep trend

Home dashboard must not become a wall of charts.

---

# 8. QUICK ACTIONS

Home dashboard must have obvious quick actions.

Examples:

+ Add Expense
+ Add Income
+ Add Task
+ Log Habit
+ Log Sleep
+ Log Workout
+ Add Goal
+ Add Event

These should open a modal, drawer, or dedicated quick-entry UI.

The user should be able to record common activities with minimal clicks.

---

# 9. FINANCE MODULE

## Accounts

Support:

- Cash
- Bank
- Mobile Wallet
- Credit Card
- Investment
- Other

Fields:

- name
- account type
- opening balance
- currency
- active

---

## Transactions

Create one central transaction system.

Fields:

- id
- date
- type
- category
- subcategory
- description
- merchant
- account
- payment method
- amount
- notes
- created_at
- updated_at

Types:

- Income
- Expense
- Transfer

Transfers must not be included in income/expense analytics.

---

## Income

Examples:

- Salary
- Freelance
- Bonus
- Investment
- Other

---

## Expenses

Allow customizable categories:

- Housing
- Food
- Groceries
- Transport
- Utilities
- Shopping
- Entertainment
- Health
- Education
- Travel
- Family
- Personal
- Other

Categories must be stored in the database.

Do not hard-code them into UI components.

---

## Budget

User can create monthly budgets by category.

Display:

Budget
Actual
Remaining
Utilization %
Status

Statuses:

Safe
Warning
Exceeded

Warning threshold must be configurable.

---

## Savings Goals

Fields:

- Name
- Target
- Current amount
- Target date
- Progress

---

## Bills

Fields:

- name
- category
- amount
- due date
- frequency
- account
- paid status

---

## Subscriptions

Fields:

- service
- category
- amount
- billing cycle
- renewal date
- payment method
- active

---

## Debt

Fields:

- name
- original amount
- remaining amount
- payment
- interest rate
- due date

---

## Assets

Track:

- cash
- bank
- investments
- property
- vehicles
- others

---

## Liabilities

Track:

- loans
- credit cards
- other liabilities

---

## Net Worth

Calculate:

Total Assets - Total Liabilities

Track historical net worth.

---

# 10. FINANCE DASHBOARD

Create a dedicated Finance dashboard.

KPI cards:

- Balance
- Income
- Expenses
- Savings
- Savings Rate
- Budget Remaining
- Net Worth

Charts:

1. Income vs Expense
2. Monthly Savings
3. Expense by Category
4. Budget vs Actual
5. Net Worth Trend
6. Daily Spending

Tables:

- Recent transactions
- Largest expenses
- Upcoming bills
- Budget warnings
- Subscriptions

Filters:

- Year
- Month
- Account
- Category
- Date range

Changing filters must update relevant KPIs and charts.

---

# 11. HEALTH

Create personal health tracking.

This is tracking only.

Do not provide medical diagnosis or treatment advice.

Track optional metrics:

- Weight
- Water
- Steps
- Exercise minutes
- Calories
- Mood
- Stress
- Notes

Users should be able to choose which metrics they want to track.

---

# 12. SLEEP

Track:

- Date
- Bedtime
- Wake time
- Sleep duration
- Sleep target
- Sleep quality
- Notes

Calculate:

- average sleep
- weekly average
- monthly average
- target achievement
- consistency

Charts:

- sleep trend
- target vs actual

---

# 13. MEDICATION

Personal tracking only.

Track:

- Medication
- Dosage
- Frequency
- Scheduled time
- Start date
- End date
- Refill date
- Status

Medication log:

- Date
- Medication
- Scheduled
- Taken
- Missed

Calculate adherence percentage.

Do not provide medical recommendations.

---

# 14. HABITS

Create a proper habit system.

Habit definition:

- name
- category
- frequency
- target
- start date
- active

Habit log:

- date
- habit
- completed
- value
- notes

Calculate:

- completion %
- current streak
- best streak
- total completions
- weekly %
- monthly %

Visualizations:

- heatmap
- progress bars
- streak cards
- weekly trend

Habit completion should be extremely easy from the dashboard.

---

# 15. PRODUCTIVITY

Create:

Tasks
Focus Sessions
Daily Planning

Task fields:

- title
- date
- deadline
- priority
- category
- status
- estimated time
- actual time
- notes

Statuses:

Not Started
In Progress
Completed
Cancelled

Calculate:

- completion %
- overdue tasks
- completed tasks
- remaining tasks
- focus time

---

# 16. GOALS

Create configurable goals.

Categories:

- Financial
- Career
- Health
- Fitness
- Learning
- Travel
- Personal
- Family
- Projects

Goal fields:

- title
- category
- start date
- target date
- starting value
- current value
- target value
- progress
- priority
- status
- notes

Support milestones.

Show:

- progress bar
- percentage
- deadline
- milestone progress

---

# 17. FITNESS

Track:

- Date
- Workout
- Exercise
- Duration
- Sets
- Reps
- Weight
- Steps
- Calories

Analytics:

- weekly workouts
- monthly workouts
- total minutes
- consistency

---

# 18. NUTRITION

Optional.

Track:

- Date
- Meal
- Food
- Calories
- Protein
- Carbs
- Fat
- Water

Keep this as tracking/analytics only.

---

# 19. LEARNING

Track:

- Course
- Book
- Skill
- Certification
- Project
- Session date
- Study minutes
- Completion %
- Status
- Notes

Dashboard metrics:

- Study hours
- Courses
- Books
- Certifications
- Active learning
- Monthly learning time

---

# 20. CAREER

Track:

- Company
- Position
- Location
- Application date
- Salary
- Status
- Interview stage
- Interview date
- Notes

Also:

- Skills
- Projects
- Certifications
- Achievements

Dashboard:

- Applications
- Interviews
- Offers
- Success rate
- Career goals

---

# 21. TRAVEL

## Trips

Track:

- destination
- country
- city
- start date
- end date
- budget
- actual cost
- purpose
- rating
- notes

## Wishlist

Track:

- destination
- priority
- estimated cost
- target date
- status

## Trip Planning

Track:

- flights
- accommodation
- transport
- activities
- food
- miscellaneous

Analytics:

- total trips
- countries
- cities
- travel spending
- budget vs actual

---

# 22. SHOPPING

Track:

- item
- category
- store
- price
- priority
- need/want
- status
- purchase date

Analytics:

- spending
- wishlist value
- need vs want
- category spending

---

# 23. VEHICLE

Track:

- vehicle
- fuel
- quantity
- cost
- mileage
- maintenance
- repairs
- insurance
- service date
- notes

Analytics:

- fuel spending
- cost/km
- maintenance spending
- ownership cost

---

# 24. HOME MANAGEMENT

Track:

- Rent
- Electricity
- Gas
- Water
- Internet
- Maintenance
- Furniture
- Appliances
- Household expenses

---

# 25. ENTERTAINMENT

Track:

- Movies
- Series
- Books
- Games
- Music

Fields:

- title
- type
- date
- rating
- cost
- status
- notes

---

# 26. CALENDAR

Create one unified calendar.

Display relevant records from:

- tasks
- events
- bills
- subscriptions
- travel
- goal deadlines
- medication schedules
- birthdays
- appointments

Allow:

- month
- week
- day

views where practical.

---

# 27. JOURNAL

Simple personal journal.

Fields:

- date
- mood
- highlight
- challenge
- lesson
- gratitude
- reflection

Keep it lightweight.

---

# 28. LIFE SCORE

Create a personal analytics score from 0–100.

Potential components:

- Finance
- Health
- Sleep
- Habits
- Productivity
- Goals
- Learning

Weights must be configurable in Settings.

Show:

- current score
- previous score
- change
- component scores

Clearly identify this as a personal metric, not a scientifically validated health score.

---

# 29. INSIGHTS

Create a simple rule-based insights engine.

Examples:

"Your spending increased 15% compared with last month."

"Food is your largest expense category this month."

"Your average sleep decreased compared with last month."

"You completed 87% of your habits this week."

"Your savings rate increased."

"Your goal deadline is approaching."

Never generate an insight when there is insufficient data.

Do not fabricate trends.

---

# 30. REPORTS

Create:

## Monthly Report

- income
- expenses
- savings
- budget
- health
- habits
- productivity
- goals

## Yearly Review

- total income
- spending
- savings
- net worth change
- habits
- goals
- learning
- travel
- lifestyle trends

Allow the user to select a year/month.

---

# 31. SEARCH

Provide global search for:

- transactions
- tasks
- goals
- habits
- learning
- travel
- events

Keep it simple and fast.

---

# 32. IMPORT / EXPORT

Support:

CSV export

JSON backup

CSV import where practical.

When importing:

- validate data
- show errors
- show duplicates
- allow user to review before inserting

Never silently insert invalid data.

---

# 33. SETTINGS

Create Settings pages for:

Profile
Currency
Timezone
Theme
Categories
Accounts
Payment methods
Habits
Goal categories
Health metrics
Notifications
Life Score weights

Theme:

- Light
- Dark
- System

---

# 34. AUTHENTICATION

Implement:

- Sign up
- Login
- Logout
- Password reset
- Session persistence

Each user must only see their own data.

Use database-level access controls where supported.

---

# 35. DATABASE

Use PostgreSQL.

Create normalized tables where appropriate.

Potential entities:

users
profiles
accounts
transactions
categories
budgets
savings_goals
bills
subscriptions
assets
liabilities
habits
habit_logs
tasks
focus_sessions
goals
goal_milestones
sleep_logs
health_logs
medications
medication_logs
workouts
nutrition_logs
learning_items
learning_sessions
career_applications
travel_trips
travel_items
shopping_items
vehicles
vehicle_logs
home_expenses
entertainment_items
events
journal_entries
notifications
settings

Do not blindly create every table.

Use the simplest sensible normalized architecture.

---

# 36. DATABASE RULES

Important tables should have:

- UUID primary key
- user_id
- created_at
- updated_at

Use:

- foreign keys
- indexes
- constraints
- unique constraints where appropriate

Every user's private data must be isolated.

---

# 37. UI COMPONENT SYSTEM

Create reusable components:

- AppShell
- Sidebar
- MobileNav
- Header
- PageHeader
- KPI Card
- Chart Card
- Data Table
- Form Modal
- Drawer
- Confirmation Dialog
- Date Picker
- Month Selector
- Filter Bar
- Progress Bar
- Progress Ring
- Badge
- Empty State
- Loading State
- Error State
- Toast

Avoid duplicating components.

---

# 38. UI STYLE

Visual direction:

Modern
Minimal
Premium
Professional
Calm
Data-driven

Avoid:

- excessive gradients
- excessive animation
- excessive rounded cards
- childish gamification
- dashboard clutter

Use whitespace and hierarchy.

Create one central design system rather than styling every page independently.

---

# 39. RESPONSIVE DESIGN

Desktop:

Sidebar + dashboard layout.

Tablet:

Collapsible navigation.

Mobile:

Drawer or bottom navigation.

All forms must work on mobile.

Tables must adapt using:

- cards
- horizontal scrolling
- stacked layout

where appropriate.

---

# 40. EMPTY STATES

Every module must have useful empty states.

Example:

"No transactions yet."

Button:

"Add your first transaction"

Do NOT leave blank screens.

---

# 41. LOADING STATES

Use skeletons or appropriate loading UI.

Avoid large blank spaces while data loads.

---

# 42. ERROR STATES

Show human-readable error messages.

Never expose raw stack traces to users.

---

# 43. NOTIFICATIONS

Create internal notifications/reminders for:

- bills
- subscriptions
- tasks
- events
- goals
- medication
- habits

External push/email notifications are future features unless straightforward to implement.

---

# 44. SECURITY

Implement:

- authentication
- authorization
- user data isolation
- server-side validation
- secure environment variables
- protected routes
- database security
- safe error handling

Never expose secrets to client-side code.

---

# 45. PERFORMANCE

Design for thousands of records.

Use:

- pagination
- indexed queries
- server-side aggregation
- efficient chart queries
- lazy loading

Do not retrieve unnecessary data.

---

# 46. TESTING

Create:

## Unit tests

For:

- savings
- budgets
- net worth
- habit completion
- streaks
- goal progress
- sleep calculations
- Life Score

## Integration tests

For:

- authentication
- CRUD
- dashboard queries
- filters
- import/export
- user isolation

## E2E tests

At minimum test:

1. Register
2. Login
3. Create account
4. Add income
5. Add expense
6. View dashboard
7. Create budget
8. Record habit
9. Create goal
10. Log sleep
11. Filter dashboard
12. Logout

---

# 47. DEMO DATA

Create realistic development/demo data covering several months.

Include:

- income
- expenses
- budgets
- savings
- bills
- subscriptions
- habits
- tasks
- goals
- sleep
- fitness
- learning
- travel
- events

This data should make dashboards visually meaningful.

Provide a reset/seed mechanism.

---

# 48. MVP

The FIRST working release must contain:

### Authentication

### Home Dashboard

### Finance

### Habits

### Tasks

### Goals

### Sleep

### Settings

Do not delay MVP by implementing every module.

After MVP is stable, add:

Health
Fitness
Medication
Learning
Career
Travel
Shopping
Vehicle
Home
Entertainment
Journal

---

# 49. DEVELOPMENT PHASES

## PHASE 0
Project foundation

- repository inspection
- Next.js setup
- design system
- database
- authentication
- app shell
- navigation
- routing

## PHASE 1
Finance MVP

## PHASE 2
Finance Dashboard

## PHASE 3
Habits + Tasks + Goals

## PHASE 4
Productivity Dashboard

## PHASE 5
Sleep + Health + Fitness + Medication

## PHASE 6
Learning + Career

## PHASE 7
Travel + Shopping + Vehicle + Home + Entertainment + Journal

## PHASE 8
Master Dashboard + Life Score + Insights

## PHASE 9
Reports + Import/Export + Notifications

## PHASE 10
QA + Performance + UX polish

---

# 50. DEVELOPMENT BEHAVIOR

At the beginning:

1. Inspect repository/environment.
2. Detect whether an application already exists.
3. Reuse existing infrastructure where appropriate.
4. Produce a compact architecture plan.
5. Immediately implement Phase 0.

After each phase:

- run tests
- run build
- fix errors
- verify the UI
- continue automatically

Do not repeatedly ask for permission.

---

# 51. BROWSER-FIRST REQUIREMENT

This is critical.

The primary deliverable is the actual RUNNING WEB APPLICATION.

Do not optimize the output for showing code.

Optimize for:

- browser experience
- UI
- interaction
- usability
- data persistence

When possible:

1. start the development server
2. open the application
3. verify important pages visually
4. interact with forms/buttons
5. fix layout or runtime issues
6. continue

If browser/screenshot tools are available, use them to verify the interface.

---

# 52. VISUAL QA

Before considering a page complete, verify:

- no overflow
- no broken layout
- no clipped text
- no console/runtime errors
- responsive behavior
- consistent spacing
- consistent typography
- usable forms
- correct loading states
- useful empty states
- correct charts

Do not consider "the code compiles" sufficient.

---

# 53. ACCESSIBILITY

Use:

- semantic HTML
- accessible labels
- keyboard navigation
- focus states
- sufficient contrast
- accessible dialogs
- accessible form validation

Do not communicate meaning through color alone.

---

# 54. GITHUB / VERSION CONTROL

Use clean commits by milestone if Git is available.

Example:

foundation
finance
finance-dashboard
productivity
health
analytics
qa

Avoid meaningless commits.

---

# 55. DOCUMENTATION

Create concise:

README.md
ARCHITECTURE.md
DATABASE.md
QA.md

Document:

- setup
- environment variables
- database setup
- migrations
- seed data
- architecture
- testing
- deployment

---

# 56. ENVIRONMENT

Create:

.env.example

Never commit secrets.

Document all required environment variables.

---

# 57. DEPLOYMENT

Design for easy deployment.

Preferred:

Application → Vercel

Database/Auth → Supabase

Document deployment steps.

---

# 58. FUTURE-READY ARCHITECTURE

Do not implement yet, but avoid blocking:

- PWA
- mobile application
- AI personal assistant
- natural-language data entry
- voice entry
- receipt OCR
- bank imports
- calendar integration
- wearable integrations
- email reminders
- push notifications
- financial forecasting

These are future phases.

---

# 59. IMPORTANT PRODUCT PRINCIPLE

The user does NOT have to use every module.

LifeOS must remain useful when only some areas are populated.

Examples:

Finance + Habits

or:

Finance + Sleep + Goals

or:

Health + Fitness

Dashboards must handle missing data gracefully.

---

# 60. FINAL USER EXPERIENCE

The finished application should work like this:

OPEN LIFEOS

↓

SEE TODAY'S OVERVIEW

↓

CLICK "+ EXPENSE"

↓

FORM OPENS

↓

ENTER:
৳350
Food
Lunch
Cash

↓

CLICK SAVE

↓

TRANSACTION STORED

↓

DASHBOARD UPDATES

↓

EXPENSE CHART UPDATES

↓

FOOD CATEGORY UPDATES

↓

BUDGET UPDATES

↓

BALANCE UPDATES

↓

SAVINGS UPDATES

↓

USER SEES THE RESULT

The same principle should apply throughout the application.

---

# 61. OUTPUT EFFICIENCY

Do not waste output repeating the specification.

Do not print huge source files unless requested.

Do not explain every small implementation decision.

For each completed milestone, report only:

## DONE
What was implemented.

## CHANGED
Important files/modules.

## TESTED
Tests/build/browser checks.

## ISSUES
Only actual issues.

## NEXT
Next milestone.

Then continue working.

---

# 62. START NOW

First:

- inspect the environment/repository
- produce a compact architecture summary
- create the initial application structure
- set up the database/auth foundation
- create the design system
- create the global app shell
- create the navigation
- create the Home placeholder/dashboard shell
- run the application

The objective is to reach a point where I can open LifeOS in a browser and SEE the application interface.

Do NOT generate an Excel workbook.

Do NOT generate a Google Sheet.

Do NOT stop at code examples.

BUILD THE ACTUAL WEB APPLICATION.