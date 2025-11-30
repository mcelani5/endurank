# Endurank - Endurance Sports Gear & Race Review Platform

A modern, personalized review platform for endurance athletes built with Next.js, Firebase, and shadcn/ui.

## Features

### Core Innovation: Endurank Algorithm
Personalized recommendation scores based on:
- User's cost sensitivity (Economy, Mid-Range, Performance)
- Weighted average ratings (tiered review system)
- Normalized pricing within categories

### Tiered Review System
- **Beginner** (0-3 reviews): Weight 0.75
- **Contributor** (4-10 reviews): Weight 1.0
- **Expert** (11+ reviews): Weight 1.25

### MVP Features ✅

- **User Authentication**: Firebase Auth with email/password
- **Onboarding Flow**: 3-step survey to personalize recommendations
  - Skill Level
  - Preferred Race Distance
  - Budget/Cost Sensitivity
- **Product Listings**: Browse bikes, running shoes, and races
- **Product Detail Pages**: Detailed specs, Endurank scores, and reviews
- **Review System**: Submit and view reviews with star ratings
- **Race Reviews**: Special 4-dimension ratings (Course, Cost, Volunteers, Spectators)
- **Wishlist**: Save favorite gear and races
- **Admin Panel**: Add new products and races

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Firebase (Auth + Firestore)
- **Language**: TypeScript
- **Icons**: Lucide React

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Firebase

1. Create a new Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password provider)
3. Create a Firestore database
4. Copy your Firebase config

### 3. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Firebase credentials:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with your Firebase project settings:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
trireview/
├── app/                    # Next.js app router pages
│   ├── auth/              # Authentication page
│   ├── onboarding/        # User onboarding flow
│   ├── gear/              # Gear listings and detail pages
│   ├── races/             # Race listings and detail pages
│   ├── wishlist/          # User wishlist
│   └── admin/             # Admin panel
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── auth/             # Auth-related components
│   ├── layout/           # Layout components (Navbar)
│   ├── onboarding/       # Onboarding flow components
│   ├── products/         # Product card components
│   └── reviews/          # Review components
├── lib/                   # Utility functions and configs
│   ├── firebase.ts       # Firebase initialization
│   ├── types.ts          # TypeScript type definitions
│   ├── endurank.ts       # Endurank calculation logic
│   ├── db-utils.ts       # Firestore helper functions
│   ├── utils.ts          # General utilities
│   └── auth-context.tsx  # Auth context provider
└── public/               # Static assets
```

## Key Pages

- **/** - Landing page with features overview
- **/auth** - Sign in / Sign up
- **/onboarding** - 3-step personalization survey
- **/gear** - Browse endurance sports gear
- **/gear/[id]** - Gear product detail page
- **/races** - Browse endurance sports races
- **/wishlist** - User's saved items
- **/admin** - Add new products and races (admin only)

## Endurank Formula

```
Endurank = (W_R × R_weighted) + (W_P × (1 - C) × R_weighted) - (W_C × C × P_norm)
```

Where:
- `R_weighted`: Weighted average rating
- `C`: User's cost sensitivity (0-1)
- `P_norm`: Normalized price (0-1)
- `W_R = 0.6`: Weight for rating
- `W_P = 0.3`: Weight for value
- `W_C = 0.1`: Weight for cost penalty

## Next Steps

### For Development:
1. Add Firebase credentials to `.env.local`
2. Create Firestore collections: `users`, `gear`, `races`, `reviews`
3. Implement actual Firestore queries (currently using mock data)
4. Add image upload functionality
5. Implement search and filtering
6. Add pagination for listings

### Future Features (Phase 2):
- Nutrition category (gels, chews, etc.)
- AI-assisted product recommendations
- Automated web scraping for imported reviews
- Social features (follow users, upvote reviews)
- Mobile app (iOS/Android)
- Expand beyond triathlon to other endurance sports

## Design UI/UX
- Clarity: Use simple language and clear hierarchy. Avoid excessive jargon in primary navigation/filtering.
- Trust: Highlight the source of the data (Usernames or Web Source). Use visible Tier Badges (e.g., Bronze/Silver/Gold) next to reviewer names.
- Guidance: Use color and prominence to emphasize the personalized Endurank over the standard rating.

## User Stories

### Epic 1: User Onboarding and Identity (Accounts & Customization)
- Goal: Establish user identity and capture necessary data for personalized scoring.
ID,User Story,Priority,Notes
- US-1.1,"As a New User, I want to register an account using my email and password so I can contribute reviews and save items.",High,Needs database model for users and secure authentication.
- US-1.2,"As a New User, I want to be prompted with a mandatory onboarding survey (Budget, Distance, Skill) immediately after registration so my recommendations are customized.",High,Data captured must be associated with the user profile for Endurank calculation.
- US-1.3,"As a Returning User, I want to log in easily so I can access my personalized views and reviews.",High,Standard login flow.

### Epic 2: Recommendation Engine and Display ($\text{Endurank}$ & PDP)
- Goal: Implement the proprietary scoring logic and display it clearly on the Product Detail Page.
ID,User Story,Priority,Notes
- US-2.1,"As a Beginner User, I want to see a personalized Endurank on every Gear/Race detail page so I know the product is specifically suited to my budget and needs.",High,"Requires implementation of the approved Endurank formula, leveraging user onboarding data."
- US-2.2,"As a User, I want to view a Product Detail Page (PDP) that clearly displays the product image, Endurank, Average 5-Star Rating, and Price above the fold.",High,Matches the PDP wireframe structure.
- US-2.3,"As a User, I want to be able to filter the main product listings by Price and Rating (Endurank or Average) so I can quickly narrow down options.",High,"Filtering required for all MVP categories (Gear, Races)."


### Epic 3: Review Contribution and Quality Control
- Goal: Enable user-generated content submission and implement quality weighting.

ID,User Story,Priority,Notes
- US-3.1,"As a Logged-in User, I want to submit a 5-star review that includes a Title and Subject (Full Text) for any item so I can contribute to the community data.",High,Must record the user's ReviewCount for weighting.
- US-3.2,"As a Logged-in User, I want my overall review count to automatically update so my future reviews receive the correct Tiered Review Weight.",High,Requires database trigger or logic to increment the count and apply the correct weight factor.
- US-3.3,"As a User, I want to see the Average Rating of a Race broken down into its four sub-categories (Course, Cost, Volunteers, Spectators) so I can understand specific aspects of the event.",High,Requires input fields on the race review form for these four sub-ratings.

### Epic 4: Content Acquisition and Attribution
- Goal: Integrate basic data acquisition and clearly display review sources.

ID,User Story,Priority,Notes
- US-4.1,"As an Admin, I want to manually add new Gear (Bike/Shoe) and Race products to the database so users have items to review at launch.",High,Requires a simple internal admin interface.
- US-4.2,"As a User, I want to see imported review snippets on the PDP that clearly cite the original website source (e.g., Reddit) so I know where the data originated.",High,Proof-of-concept for the content attribution strategy.

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

MIT
