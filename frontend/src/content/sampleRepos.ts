/* Sample repositories for the UI preview ("Preview data" in the footer). All made up:
   owners, names and numbers. Only used to show how results look; the ranking over them is
   random (lib/preview/fakeSearch.ts). */

export type Level = "beginner" | "intermediate" | "advanced";

export interface SampleRepo {
  full_name: string;
  description: string;
  readme: string;
  topics: string[];
  technologies: string[];
  language: string;
  complexity: Level;
  stars: number;
  forks: number;
  updated: string; // ISO date
  license: string;
}

export const SAMPLE_REPOS: SampleRepo[] = [
  // inventory / warehouse
  { full_name: "kimsan-dev/nest-inventory-starter", description: "Beginner inventory management API: products, stock levels and suppliers.", readme: "A starter inventory management system built with NestJS and PostgreSQL. Track products, stock levels, suppliers and purchase orders. Written as a tutorial: every module has comments and a step-by-step guide. Uses TypeORM migrations and Swagger docs.", topics: ["inventory", "nestjs", "tutorial", "rest-api"], technologies: ["nestjs", "postgresql", "typeorm", "typescript"], language: "TypeScript", complexity: "beginner", stars: 214, forks: 61, updated: "2026-10-02", license: "MIT" },
  { full_name: "lumen-works/stockr-api", description: "Warehouse stock tracker for small shops.", readme: "Stockr keeps count of what is on your shelves. Record goods in and out, get low-stock alerts and a simple monthly report. NestJS service with a Postgres database, easy to run with Docker for a first project.", topics: ["warehouse", "stock", "small-business"], technologies: ["nestjs", "postgresql", "docker", "typescript"], language: "TypeScript", complexity: "beginner", stars: 18, forks: 4, updated: "2026-08-19", license: "MIT" },
  { full_name: "openshelf/inventory-management-nest-pg", description: "Inventory management inventory system: inventory, inventory reports, inventory API.", readme: "Inventory management. Inventory items, inventory locations, inventory reports, inventory adjustments and an inventory API. Inventory dashboard included. Built on NestJS, PostgreSQL, Redis queues and a React admin.", topics: ["inventory", "inventory-management", "nestjs"], technologies: ["nestjs", "postgresql", "redis", "react", "typescript"], language: "TypeScript", complexity: "intermediate", stars: 1840, forks: 402, updated: "2026-09-27", license: "Apache-2.0" },
  { full_name: "corebyte/nest-erp-suite", description: "Modular ERP with inventory, HR and accounting modules.", readme: "An enterprise resource planning suite: inventory, purchasing, HR, payroll and double-entry accounting. Microservices with NestJS, PostgreSQL, Redis and Kafka, deployed on Kubernetes. Production-grade, multi-tenant and scalable.", topics: ["erp", "microservices", "inventory", "accounting"], technologies: ["nestjs", "postgresql", "redis", "docker", "kubernetes", "typescript"], language: "TypeScript", complexity: "advanced", stars: 3120, forks: 655, updated: "2026-11-10", license: "AGPL-3.0" },
  { full_name: "tola-codes/django-stock-keeper", description: "Simple inventory and stock control web app for a small store.", readme: "Stock keeper is a beginner Django project: add products, record sales and purchases, and see stock on hand. Bootstrap templates, SQLite by default. Made for a university assignment.", topics: ["inventory", "django", "student-project"], technologies: ["django", "sqlite", "python", "bootstrap"], language: "Python", complexity: "beginner", stars: 77, forks: 39, updated: "2025-12-03", license: "MIT" },
  { full_name: "brightloop/warehouse-wms", description: "Warehouse management system with barcode scanning and pick lists.", readme: "A warehouse management system (WMS): receiving, put-away, barcode scanning, pick lists and shipping labels. Spring Boot backend, PostgreSQL, Angular frontend. Supports multiple warehouses and bins.", topics: ["wms", "warehouse", "logistics", "barcode"], technologies: ["spring-boot", "postgresql", "angular", "java"], language: "Java", complexity: "advanced", stars: 960, forks: 210, updated: "2026-07-14", license: "Apache-2.0" },

  // point of sale
  { full_name: "sokha-lab/pos-nest", description: "Point-of-sale backend with receipts and cash drawers.", readme: "Point of sale API: products, carts, receipts, cash drawer sessions and daily sales reports. NestJS and MySQL.", topics: ["pos", "point-of-sale", "retail"], technologies: ["nestjs", "mysql", "typescript"], language: "TypeScript", complexity: "intermediate", stars: 96, forks: 22, updated: "2026-05-30", license: "MIT" },
  { full_name: "mini-shop/react-express-pos", description: "Simple point of sale app for a small shop, React frontend and Express API.", readme: "A simple POS for a coffee shop or small shop. Ring up items, take cash or card, print a receipt and see today's sales. React with Vite on the front, Express and MongoDB behind it. Great first full-stack project.", topics: ["pos", "react", "express", "beginner-friendly"], technologies: ["react", "express", "mongodb", "nodejs", "javascript"], language: "JavaScript", complexity: "beginner", stars: 342, forks: 140, updated: "2026-09-08", license: "MIT" },
  { full_name: "checkout-hq/cashier-pro", description: "Offline-first cashier and checkout system for retail chains.", readme: "Cashier Pro is an offline-first checkout system: syncs sales when the network returns, supports multiple branches, loyalty points and tax rules. Electron and React client, Node.js and PostgreSQL server.", topics: ["pos", "retail", "offline-first", "electron"], technologies: ["react", "electron", "nodejs", "postgresql", "typescript"], language: "TypeScript", complexity: "advanced", stars: 1210, forks: 188, updated: "2026-10-21", license: "GPL-3.0" },
  { full_name: "vanna-k/laravel-pos-lite", description: "Lightweight POS with Laravel and MySQL.", readme: "POS lite: products, categories, sales and receipts in Laravel 11 with MySQL. Simple admin panel for a shop owner.", topics: ["pos", "laravel"], technologies: ["laravel", "mysql", "php"], language: "PHP", complexity: "beginner", stars: 158, forks: 71, updated: "2026-03-11", license: "MIT" },

  // school management
  { full_name: "edu-khmer/school-ms-laravel", description: "School management system: students, attendance, grades and timetables in Laravel.", readme: "A school management system built with Laravel and MySQL. Manage students, teachers and classes, take daily attendance, record grades and print report cards. Role-based login for admins, teachers and parents.", topics: ["school-management", "attendance", "laravel", "education"], technologies: ["laravel", "mysql", "php"], language: "PHP", complexity: "intermediate", stars: 688, forks: 301, updated: "2026-08-02", license: "MIT" },
  { full_name: "rithy-dev/attendance-tracker", description: "Student attendance tracker with QR check-in.", readme: "Students scan a QR code to check in to class; teachers see attendance in real time. Laravel API and a Vue frontend. Small and readable, a good student project.", topics: ["attendance", "qr-code", "education"], technologies: ["laravel", "vue", "mysql", "php"], language: "PHP", complexity: "beginner", stars: 121, forks: 47, updated: "2026-06-25", license: "MIT" },
  { full_name: "campusware/gradebook", description: "Gradebook and report cards for teachers.", readme: "Enter marks, weight assignments, compute grades and export report cards to PDF. Django and PostgreSQL.", topics: ["grades", "education", "django"], technologies: ["django", "postgresql", "python"], language: "Python", complexity: "intermediate", stars: 233, forks: 58, updated: "2026-02-17", license: "BSD-3-Clause" },

  // chat
  { full_name: "nightowl/socket-chat", description: "Real-time chat application using Socket.IO and MongoDB.", readme: "Rooms, private messages, typing indicators and message history. Node.js, Express, Socket.IO and MongoDB with Mongoose. Step-by-step README for beginners.", topics: ["chat", "socket-io", "realtime", "mongodb"], technologies: ["socketio", "express", "mongodb", "nodejs", "javascript"], language: "JavaScript", complexity: "beginner", stars: 905, forks: 410, updated: "2026-09-30", license: "MIT" },
  { full_name: "relaychat/relay", description: "Scalable messaging server with end-to-end encryption.", readme: "Relay is a horizontally scalable messaging backend: WebSockets, Redis pub/sub, end-to-end encryption and push notifications. Written in Go. Production deployments handle millions of messages a day.", topics: ["messaging", "websocket", "e2ee", "go"], technologies: ["go", "redis", "postgresql", "docker"], language: "Go", complexity: "advanced", stars: 5400, forks: 620, updated: "2026-11-12", license: "Apache-2.0" },
  { full_name: "pixelpanda/next-chat-ui", description: "Chat UI kit for Next.js with message bubbles and threads.", readme: "Drop-in React components for a messaging interface: bubbles, threads, reactions, read receipts. Works with any realtime backend. Next.js and Tailwind.", topics: ["chat", "ui-kit", "nextjs"], technologies: ["nextjs", "react", "tailwind", "typescript"], language: "TypeScript", complexity: "intermediate", stars: 1330, forks: 97, updated: "2026-10-05", license: "MIT" },

  // e-commerce
  { full_name: "shopforge/django-shop-backend", description: "E-commerce backend with payments and an admin dashboard in Django.", readme: "A full e-commerce REST API: products, carts, orders, Stripe payments, coupons and an admin dashboard. Django REST Framework, PostgreSQL, Celery and Redis.", topics: ["ecommerce", "django", "stripe", "rest-api"], technologies: ["django", "postgresql", "redis", "python"], language: "Python", complexity: "intermediate", stars: 2290, forks: 870, updated: "2026-10-11", license: "MIT" },
  { full_name: "tinycart/flask-store", description: "Tiny online store in Flask: cart, checkout and orders.", readme: "Learn e-commerce basics: a product list, cart, checkout with a fake payment, and order history. Flask, SQLite and Jinja templates. Under 1,000 lines.", topics: ["ecommerce", "flask", "learning"], technologies: ["flask", "sqlite", "python"], language: "Python", complexity: "beginner", stars: 412, forks: 205, updated: "2025-11-20", license: "MIT" },
  { full_name: "marketgrid/headless-commerce", description: "Headless commerce platform with GraphQL API and multi-vendor marketplace.", readme: "Headless e-commerce engine: multi-vendor marketplace, GraphQL API, payments, inventory sync, search and analytics. NestJS, PostgreSQL, Elasticsearch and Kubernetes.", topics: ["ecommerce", "headless", "graphql", "marketplace"], technologies: ["nestjs", "graphql", "postgresql", "kubernetes", "typescript"], language: "TypeScript", complexity: "advanced", stars: 7800, forks: 1400, updated: "2026-11-14", license: "MIT" },

  // booking
  { full_name: "staywell/hotel-booking-spring", description: "Hotel room booking system built with Spring Boot and MySQL.", readme: "Search rooms by date, make and cancel reservations, manage guests and invoices. Spring Boot, Spring Security, JPA and MySQL with a Thymeleaf UI.", topics: ["hotel", "booking", "reservation", "spring-boot"], technologies: ["spring-boot", "mysql", "java"], language: "Java", complexity: "intermediate", stars: 534, forks: 260, updated: "2026-07-01", license: "MIT" },
  { full_name: "roomly/meeting-room-booker", description: "Book meeting rooms in your office, with a calendar view.", readme: "A small reservation app for meeting rooms: calendar view, conflicts check and email reminders. Spring Boot and PostgreSQL; a good intro to JPA.", topics: ["booking", "calendar", "spring-boot"], technologies: ["spring-boot", "postgresql", "java"], language: "Java", complexity: "beginner", stars: 88, forks: 30, updated: "2026-04-09", license: "MIT" },

  // blog
  { full_name: "inkwell/next-markdown-blog", description: "Personal blog starter with Markdown posts using Next.js.", readme: "Write posts in Markdown, get a fast static blog: tags, RSS, dark mode and syntax highlighting. Next.js App Router and MDX. Deploy in one click.", topics: ["blog", "markdown", "nextjs", "starter"], technologies: ["nextjs", "react", "typescript"], language: "TypeScript", complexity: "beginner", stars: 3050, forks: 1120, updated: "2026-10-28", license: "MIT" },
  { full_name: "quillstack/headless-blog-cms", description: "Headless CMS for blogs with editor, roles and webhooks.", readme: "A headless CMS: rich-text editor, drafts, roles, webhooks and a REST and GraphQL API. Express, PostgreSQL and Prisma.", topics: ["cms", "blog", "headless"], technologies: ["express", "postgresql", "prisma", "graphql", "typescript"], language: "TypeScript", complexity: "advanced", stars: 2140, forks: 300, updated: "2026-09-15", license: "MIT" },

  // hospital
  { full_name: "carepoint/hospital-ms", description: "Hospital management system for patients, doctors and appointments.", readme: "Register patients, schedule appointments, keep medical records, manage doctors and billing. Laravel and MySQL with a role-based dashboard.", topics: ["hospital", "healthcare", "appointments"], technologies: ["laravel", "mysql", "php"], language: "PHP", complexity: "intermediate", stars: 640, forks: 330, updated: "2026-06-12", license: "MIT" },
  { full_name: "medibook/clinic-appointments", description: "Clinic appointment booking with SMS reminders.", readme: "Patients book appointments online, clinics manage doctor schedules and send SMS reminders. Django and PostgreSQL; simple to set up.", topics: ["clinic", "appointments", "healthcare", "booking"], technologies: ["django", "postgresql", "python"], language: "Python", complexity: "beginner", stars: 190, forks: 66, updated: "2026-05-02", license: "MIT" },

  // auth / boilerplates
  { full_name: "fastkit/fastapi-jwt-boilerplate", description: "REST API boilerplate with JWT authentication in FastAPI.", readme: "Sign up, log in, refresh tokens and role-based access with JWT. FastAPI, SQLAlchemy, PostgreSQL and Alembic. Tests and Docker included.", topics: ["fastapi", "jwt", "authentication", "boilerplate"], technologies: ["fastapi", "postgresql", "docker", "python"], language: "Python", complexity: "intermediate", stars: 1670, forks: 390, updated: "2026-10-30", license: "MIT" },
  { full_name: "authbase/express-auth-starter", description: "Login and register starter for Express with JWT and refresh tokens.", readme: "A beginner-friendly authentication starter: register, login, JWT access and refresh tokens, password reset. Express and MongoDB.", topics: ["authentication", "jwt", "express", "starter"], technologies: ["express", "mongodb", "nodejs", "javascript"], language: "JavaScript", complexity: "beginner", stars: 720, forks: 260, updated: "2026-08-14", license: "MIT" },
  { full_name: "gatekeep/oidc-server", description: "OpenID Connect and OAuth 2 identity server.", readme: "A certified OpenID Connect provider: OAuth 2 flows, MFA, SSO, audit logs and SCIM. Go and PostgreSQL. For production identity infrastructure.", topics: ["oauth2", "oidc", "identity", "sso"], technologies: ["go", "postgresql", "docker"], language: "Go", complexity: "advanced", stars: 4300, forks: 510, updated: "2026-11-01", license: "Apache-2.0" },

  // library
  { full_name: "booknook/library-ms-java", description: "Library management system for a student project in Java.", readme: "Add books and members, borrow and return books, track fines. Java Swing desktop app with MySQL. Made for a first-year student project.", topics: ["library-management", "java", "student-project"], technologies: ["java", "mysql"], language: "Java", complexity: "beginner", stars: 265, forks: 190, updated: "2025-10-15", license: "MIT" },
  { full_name: "shelfspace/library-api-spring", description: "Library REST API: books, members, loans and reservations.", readme: "A library management REST API in Spring Boot with PostgreSQL: catalogue search, loans, reservations and overdue fines.", topics: ["library", "rest-api", "spring-boot"], technologies: ["spring-boot", "postgresql", "java"], language: "Java", complexity: "intermediate", stars: 140, forks: 52, updated: "2026-03-28", license: "MIT" },

  // misc
  { full_name: "taskflow/kanban-react", description: "Kanban task board with drag and drop in React.", readme: "Trello-style boards, lists and cards with drag and drop. React, Express and PostgreSQL. A good intermediate full-stack project.", topics: ["kanban", "task-management", "react"], technologies: ["react", "express", "postgresql", "javascript"], language: "JavaScript", complexity: "intermediate", stars: 980, forks: 330, updated: "2026-09-21", license: "MIT" },
  { full_name: "pennywise/expense-tracker-flutter", description: "Personal expense tracker mobile app in Flutter.", readme: "Track spending by category, set budgets and see monthly charts. Flutter with SQLite on device. Beginner-friendly code.", topics: ["expense-tracker", "flutter", "finance"], technologies: ["flutter", "sqlite"], language: "Dart", complexity: "beginner", stars: 1450, forks: 600, updated: "2026-08-30", license: "MIT" },
  { full_name: "pulseboard/analytics-dashboard", description: "Admin analytics dashboard template with charts and tables.", readme: "An admin dashboard: charts, tables, filters, auth pages and dark mode. Next.js, Tailwind and Prisma with PostgreSQL.", topics: ["dashboard", "admin", "nextjs"], technologies: ["nextjs", "react", "prisma", "postgresql", "tailwind", "typescript"], language: "TypeScript", complexity: "intermediate", stars: 4100, forks: 980, updated: "2026-11-06", license: "MIT" },
];

/* Pairs shown as "Related projects" (stand-ins for the repository graph). */
export const RELATED: [string, string][] = [
  ["kimsan-dev/nest-inventory-starter", "lumen-works/stockr-api"],
  ["kimsan-dev/nest-inventory-starter", "openshelf/inventory-management-nest-pg"],
  ["openshelf/inventory-management-nest-pg", "corebyte/nest-erp-suite"],
  ["kimsan-dev/nest-inventory-starter", "sokha-lab/pos-nest"],
  ["tola-codes/django-stock-keeper", "lumen-works/stockr-api"],
  ["brightloop/warehouse-wms", "corebyte/nest-erp-suite"],
  ["mini-shop/react-express-pos", "vanna-k/laravel-pos-lite"],
  ["mini-shop/react-express-pos", "checkout-hq/cashier-pro"],
  ["sokha-lab/pos-nest", "checkout-hq/cashier-pro"],
  ["edu-khmer/school-ms-laravel", "rithy-dev/attendance-tracker"],
  ["edu-khmer/school-ms-laravel", "campusware/gradebook"],
  ["nightowl/socket-chat", "relaychat/relay"],
  ["nightowl/socket-chat", "pixelpanda/next-chat-ui"],
  ["shopforge/django-shop-backend", "tinycart/flask-store"],
  ["shopforge/django-shop-backend", "marketgrid/headless-commerce"],
  ["staywell/hotel-booking-spring", "roomly/meeting-room-booker"],
  ["inkwell/next-markdown-blog", "quillstack/headless-blog-cms"],
  ["carepoint/hospital-ms", "medibook/clinic-appointments"],
  ["fastkit/fastapi-jwt-boilerplate", "authbase/express-auth-starter"],
  ["authbase/express-auth-starter", "gatekeep/oidc-server"],
  ["booknook/library-ms-java", "shelfspace/library-api-spring"],
  ["taskflow/kanban-react", "pulseboard/analytics-dashboard"],
  ["medibook/clinic-appointments", "staywell/hotel-booking-spring"],
];
