import type { Metadata } from "next";
import DriverBoard from "@/components/driver/DriverBoard";

export const metadata: Metadata = {
  title: "Livreur — Le Grill Dufour",
  robots: "noindex, nofollow",
  manifest: "/manifest-livreur.json",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Livreur",
    "mobile-web-app-capable": "yes",
    "theme-color": "#8C2434",
  },
};

export default function DriverPage() {
  return (
    <>
      <DriverBoard />
      <script
        dangerouslySetInnerHTML={{
          __html: `if("serviceWorker"in navigator){navigator.serviceWorker.getRegistrations().then(function(r){r.forEach(function(reg){if(reg.active&&reg.active.scriptURL.includes("/sw.js")){reg.unregister()}})});window.addEventListener("load",function(){navigator.serviceWorker.register("/sw-driver.js",{scope:"/livreur"})})}`,
        }}
      />
    </>
  );
}
