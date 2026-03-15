# Contact Manager — Architecture Diagrams

## 1. System Architecture

High-level view: Browser → React Frontend → json-server API → db.json

```mermaid
graph LR
    subgraph Client["🖥️ Browser (localhost:3000)"]
        direction TB
        UI["React App<br/>(CRA)"]
        RTK["Redux Store<br/>+ RTK Query Cache"]
        Router["React Router v7<br/>Client-side Routing"]
    end

    subgraph Server["⚙️ API Server (localhost:3001)"]
        JS["json-server v1<br/>REST API"]
    end

    subgraph Storage["💾 File System"]
        DB["db.json<br/>100 Contacts"]
    end

    UI --> RTK
    RTK -->|"GET /contacts<br/>POST /contacts<br/>DELETE /contacts/:id"| JS
    JS --> DB
    JS -->|"JSON Response"| RTK
    RTK -->|"Cached Data"| UI
    UI --> Router

    style Client fill:#1a1a2e,stroke:#e94560,color:#fff
    style Server fill:#16213e,stroke:#0f3460,color:#fff
    style Storage fill:#0f3460,stroke:#533483,color:#fff
    style UI fill:#e94560,stroke:#fff,color:#fff
    style RTK fill:#533483,stroke:#fff,color:#fff
    style Router fill:#0f3460,stroke:#fff,color:#fff
    style JS fill:#0f3460,stroke:#e94560,color:#fff
    style DB fill:#533483,stroke:#e94560,color:#fff
```

---

## 2. Component Hierarchy

React component tree: App → Header, Notification, Routes → Pages

```mermaid
graph TD
    Index["index.js<br/>Provider + BrowserRouter"]
    App["App.js<br/>Root Component"]

    Header["Header.js<br/>NavLinks + Badge"]
    Notif["Notification.js<br/>Toast (auto-dismiss)"]
    EB["ErrorBoundary.js<br/>Error Fallback"]
    Suspense["Suspense<br/>Lazy Loading"]

    CL["ContactList.js<br/>/ route"]
    AC["AddContacts.js<br/>/add route"]
    CD["ContactDetail.js<br/>/contacts/:id route"]

    Confirm["ConfirmDialog.js<br/>Delete Modal"]
    CC["ContactCard.js<br/>Display Card"]

    Index --> App
    App --> Header
    App --> Notif
    App --> EB
    EB --> Suspense
    Suspense --> CL
    Suspense --> AC
    Suspense --> CD
    CL --> Confirm
    CD --> CC

    style Index fill:#2d3436,stroke:#00b894,color:#fff
    style App fill:#e17055,stroke:#fff,color:#fff
    style Header fill:#0984e3,stroke:#fff,color:#fff
    style Notif fill:#0984e3,stroke:#fff,color:#fff
    style EB fill:#0984e3,stroke:#fff,color:#fff
    style Suspense fill:#6c5ce7,stroke:#fff,color:#fff
    style CL fill:#00b894,stroke:#fff,color:#fff
    style AC fill:#00b894,stroke:#fff,color:#fff
    style CD fill:#00b894,stroke:#fff,color:#fff
    style Confirm fill:#fdcb6e,stroke:#2d3436,color:#2d3436
    style CC fill:#fdcb6e,stroke:#2d3436,color:#2d3436
```

---

## 3. RTK Query Data Flow

How data flows through the Redux store, RTK Query cache, and API

```mermaid
sequenceDiagram
    participant C as React Component
    participant H as RTK Query Hook
    participant Cache as RTK Query Cache
    participant MW as API Middleware
    participant API as json-server
    participant N as Notification Slice

    Note over C,API: READ FLOW (useGetContactsQuery)
    C->>H: useGetContactsQuery()
    H->>Cache: Check cache
    alt Cache Hit
        Cache-->>H: Return cached data
        H-->>C: { data, isLoading: false }
    else Cache Miss
        Cache->>MW: Dispatch query
        MW->>API: GET /contacts
        API-->>MW: JSON response
        MW->>Cache: Store with "Contact" tag
        Cache-->>H: Return fresh data
        H-->>C: { data, isLoading: false }
    end

    Note over C,API: WRITE FLOW (useAddContactMutation)
    C->>H: addContact({ name, phone })
    H->>MW: Dispatch mutation
    MW->>API: POST /contacts
    API-->>MW: Created contact
    MW->>N: dispatch(showNotification)
    MW->>Cache: Invalidate "Contact" tag
    Cache->>MW: Auto-refetch GET /contacts
    MW->>API: GET /contacts
    API-->>MW: Updated list
    MW->>Cache: Update cache
    Cache-->>C: Re-render with new data
```

---

## 4. Folder Structure

Visual representation of the project layout

```mermaid
graph TD
    Root["contacts-app/"]

    FE["frontend/"]
    SRC["src/"]
    PUB["public/"]

    API_DIR["api/"]
    API_FILE["contacts.js"]

    APP_DIR["app/"]
    STORE["store.js"]

    COMP["components/"]
    COMP_UI["ui/"]
    HEADER["Header.js"]
    CARD["ContactCard.js"]
    CONFIRM["ConfirmDialog.js"]
    NOTIF["Notification.js"]
    ERRBND["ErrorBoundary.js"]

    FEAT["features/"]
    API_SLICE["apiSlice.js"]
    NOTIF_SLICE["notificationSlice.js"]
    BARREL1["index.js"]

    HOOKS["hooks/"]
    HELPERS["useContactHelpers.js"]
    BARREL2["index.js"]

    PAGES["pages/"]
    CL["ContactList.js"]
    CD["ContactDetail.js"]
    AC["AddContacts.js"]

    APP_JS["App.js"]
    APP_CSS["App.css"]
    INDEX_JS["index.js"]

    SA["server-api/"]
    DB["db.json"]
    PKG2["package.json"]

    E2E["e2e/"]
    POM["pages/"]
    SPECS["*.spec.js"]

    CONFIG["playwright.config.js"]
    README["README.md"]
    GIT[".gitignore"]
    ENV[".env"]

    Root --> FE
    Root --> SA
    Root --> E2E
    Root --> CONFIG
    Root --> README
    Root --> GIT

    FE --> SRC
    FE --> PUB
    FE --> ENV

    SRC --> API_DIR --> API_FILE
    SRC --> APP_DIR --> STORE
    SRC --> COMP
    COMP --> COMP_UI
    COMP --> HEADER
    COMP --> CARD
    COMP_UI --> CONFIRM
    COMP_UI --> NOTIF
    COMP_UI --> ERRBND

    SRC --> FEAT
    FEAT --> API_SLICE
    FEAT --> NOTIF_SLICE
    FEAT --> BARREL1

    SRC --> HOOKS
    HOOKS --> HELPERS
    HOOKS --> BARREL2

    SRC --> PAGES
    PAGES --> CL
    PAGES --> CD
    PAGES --> AC

    SRC --> APP_JS
    SRC --> APP_CSS
    SRC --> INDEX_JS

    SA --> DB
    SA --> PKG2

    E2E --> POM
    E2E --> SPECS

    style Root fill:#2d3436,stroke:#dfe6e9,color:#fff
    style FE fill:#0984e3,stroke:#fff,color:#fff
    style SA fill:#00b894,stroke:#fff,color:#fff
    style E2E fill:#6c5ce7,stroke:#fff,color:#fff
    style SRC fill:#74b9ff,stroke:#fff,color:#fff
    style COMP fill:#fd79a8,stroke:#fff,color:#fff
    style COMP_UI fill:#e17055,stroke:#fff,color:#fff
    style FEAT fill:#fdcb6e,stroke:#2d3436,color:#2d3436
    style HOOKS fill:#55efc4,stroke:#2d3436,color:#2d3436
    style PAGES fill:#a29bfe,stroke:#fff,color:#fff
```
