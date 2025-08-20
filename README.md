# ASCPi Quest Pro

ASCPi Quest Pro is an exam simulation web app built with Vite, React, and TypeScript. It uses Tailwind CSS and shadcn/ui for styling and integrates with Supabase for authentication and data storage.

## Features

- **Email login** using Supabase's magic link authentication.
- **Start, resume, and finish sessions** while tracking score and progress.
- **Multiple-choice interface** that highlights correct answers and shows explanations.
- **Review incorrect questions** after completing a session.
- **Testing utilities** for adding and viewing questions in the database.

## Development

1. Install [Node.js](https://nodejs.org/) and npm.
2. Install dependencies:

```sh
npm install
```

3. Run the development server:

```sh
npm run dev
```

4. Lint the project:

```sh
npm run lint
```

5. Build for production:

```sh
npm run build
```

## Architecture

- React components live in `src/components` and page-level views live in `src/pages`.
- `src/integrations/supabase` configures the Supabase client and type definitions.
- `src/hooks` contains reusable hooks such as toast notifications and mobile detection.

## License

This project is provided as-is without warranty.
