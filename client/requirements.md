## Packages
framer-motion | Page transitions and complex animations
recharts | Dashboard analytics charts and data visualization
date-fns | Human-readable date formatting
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility for merging Tailwind CSS classes
lucide-react | Icon set (already in base, but listing for completeness)

## Notes
The application uses a "terminal" aesthetic for logs (JetBrains Mono font).
Dark mode is the default and primary theme.
API endpoints defined in shared/routes.ts are strictly followed.
"Teach Mode" functionality assumes a POST endpoint for actions exists or will handle runtime errors gracefully if missing.
Logs polling is implemented in the Run Details page using react-query's refetchInterval.
