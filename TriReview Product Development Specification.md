


# 📝 TriReview Product Development Specification

## 1. Product Requirements Document (PRD) Summary

### 1.1 Goal & Target Audience

- **Goal:** Build TriReview, an app helping triathletes (primarily **beginners**) find the best gear, races, and nutrition via consolidated, AI-assisted, and personalized reviews.
    
- **Target:** Beginners seeking trusted, value-oriented recommendations.
    

### 1.2 Core Innovation: The TriScore

The app's unique value is the **TriScore**, a personalized recommendation score based on user input.

$$\text{TriScore} = (W_R \times R_{weighted}) + (W_P \times (1 - C) \times R_{weighted}) - (W_C \times C \times P_{norm})$$

- $R_{weighted}$: Average 5-star rating (weighted by reviewer tier).
    
- $C$: User's **Cost Sensitivity factor** (from onboarding).
    
- $P_{norm}$: Normalized Price (price relative to category max price).
    

### 1.3 Review Quality Control (Tiered Weighting)

User-submitted 5-star ratings are weighted based on the reviewer's contribution level:

- **Tier 1 (Beginner):** $0-3$ reviews (Weight $0.75$)
    
- **Tier 2 (Contributor):** $4-10$ reviews (Weight $1.0$)
    
- **Tier 3 (Expert):** $11+$ reviews (Weight $1.25$)
    

### 1.4 Data Strategy & Attribution

- **Hybrid Content:** Content will be user-generated reviews and imported reviews (scraped from external sources).
    
- **Attribution Mandate:** All imported reviews/snippets **must clearly cite the original website source** (e.g., Reddit) as the "Author" to ensure ethical and legal compliance.
    

---

## 2. Phase 1 (MVP) Scope Definition

The MVP focuses on proving the core value proposition and core categories.

|**Area**|**Scope Details**|**Exclusions (Phase 2+)**|
|---|---|---|
|**Categories**|**Gear** (**Bikes, Running Shoes**) and **Races**.|Nutrition category (Gels, Chews, etc.).|
|**Logic**|Full implementation of **TriScore**, Tiered Weighting, User Accounts, and Wishlist.|AI-assisted product addition.|
|**Content**|Primary focus on **User-Generated Reviews**. Limited, manually curated **Imported Reviews** for proof of concept.|Full automated web scraping service.|
|**Platform**|Focus on a single platform (e.g., initial **web/mobile framework**).|Second platform (e.g., dedicated iOS/Android).|

---

## 3. Data Models (MVP Focus)

### 3.1 Gear Item Model

- **ProductID, ProductName, Brand** (String)
    
- **SubCategory** (Enum: Bikes, Running Shoes)
    
- **MSRP** (Float, used for $P_{norm}$)
    
- **AverageRating, TotalReviewsCount** (Float, Integer)
    
- **Specs** (JSON/Map)
    

### 3.2 Race Item Model

- **RaceID, RaceName** (String)
    
- **RaceDate** (Date)
    
- **Location** (City, State/Region)
    
- **Distance** (Enum: Sprint, Olympic, Half, Full)
    
- **MSRP** (Float, used for $P_{norm}$)
    
- **Avg_CourseRating, Avg_CostRating, Avg_VolunteersRating, Avg_SpectatorRating** (Floats for the four required sub-ratings)
    

---

## 4. MVP Development Epics & User Stories

### Epic 1: User Onboarding and Identity

|**US-ID**|**User Story**|
|---|---|
|US-1.1|As a **New User**, I want to **register an account** so I can submit reviews.|
|US-1.2|As a **New User**, I want a **mandatory onboarding survey** (Budget, Distance, Skill) immediately after registration to customize my $\text{TriScore}$.|
|US-1.3|As a **Returning User**, I want to **log in** easily to access my personalized views.|

### Epic 2: Recommendation Engine and Display

|**US-ID**|**User Story**|
|---|---|
|US-2.1|As a **Beginner User**, I want to see a **personalized $\text{TriScore}$** on every product page, calculated using my onboarding inputs.|
|US-2.2|As a **User**, I want the Product Detail Page (PDP) to clearly display the $\text{TriScore}$, Average Rating, and Price.|
|US-2.3|As a **User**, I want to be able to **filter** the main product listings by **Price** and **Rating ($\text{TriScore}$ or Average)**.|

### Epic 3: Review Contribution and Quality Control

|**US-ID**|**User Story**|
|---|---|
|US-3.1|As a **Logged-in User**, I want to **submit a 5-star review** (Title + Full Text) for any item, which will automatically update my review count and tier weight.|
|US-3.2|As a **Logged-in User**, I want to provide **four mandatory sub-ratings** when reviewing a **Race** (Course, Cost, Volunteers, Spectators).|
|US-3.3|As a **User**, I want to see the **Average Rating** of an item calculated using the **Tiered Review Weight System**.|

### Epic 4: Content Acquisition and Attribution

|**US-ID**|**User Story**|
|---|---|
|US-4.1|As an **Admin**, I want an interface to manually **add new Gear and Race** products to the database.|
|US-4.2|As a **User**, I want to see **imported review snippets** on the PDP that **clearly cite the original website source** (e.g., Reddit) as the author.|

---

## 5. UI/UX Specification

### 5.1 Design Principles

- **Focus:** Clarity, Trust, and Guidance.
    
- **Trust Building:** Use visible **Tier Badges** (e.g., Bronze/Silver/Gold) next to reviewer usernames.
    

### 5.2 Key Screen Layouts

#### A. Onboarding Flow (3 Steps)

1. **Budget Screen:** Input for **Cost Sensitivity ($C$)** (e.g., Economy, Mid-Range, Performance).
    
2. **Race Focus Screen:** Input for **Preferred Race Distance**.
    
3. **Skill Level Screen:** Input for **Experience Level**.
    

#### B. Product Detail Page (PDP)

1. **Header:** **Product Photo, Name, Brand.**
    
2. **Recommendation Block:** **Large $\text{TriScore}$** (e.g., 9.2/10, in a prominent color) next to the smaller, standard **Average 5-Star Rating**.
    
3. **Action:** Prominent **[Add to Wishlist]** button.
    
4. **Specifications:** Price, Key Specs (or Race Location/Date).
    
5. **Reviews Section (Tabbed):**
    
    - **Tab 1 (Default):** User Reviews (showing **Username + Tier Badge**).
        
    - **Tab 2:** Imported Feedback (snippets showing clear **Website Source**).
        
    - **Race PDP Only:** Display the four average sub-ratings as bar graphs (Course, Cost, Volunteers, Spectators).