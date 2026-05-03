import { Outlet } from "react-router-dom"
import SkyBackground from "./components/SkyBackground"

// Persistent shell for routes that share the sky. The sky stays mounted
// across navigations between Mountain and Detail, so its CSS animations
// (clouds, stars, gradient) never re-init on click.
export default function Layout() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0f] text-white">
      <SkyBackground />
      <Outlet />
    </div>
  )
}
