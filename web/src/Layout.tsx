import { Outlet } from "react-router-dom"
import SkyBackground from "./components/SkyBackground"

export default function Layout() {
  return (
    <>
      <SkyBackground />
      <Outlet />
    </>
  )
}
