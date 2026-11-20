import { router } from "expo-router"

import { Button } from "@/components/ui/Button"
import { InfoState } from "@/components/ui/InfoState"
import { Page } from "@/components/ui/Page"

export default function NotFound() {
  return (
    <Page>
      <InfoState icon="compass-outline" title="Page not found" body="This link doesn't lead anywhere in the app." />
      <Button title="Go to News" onPress={() => router.replace("/")} className="mx-6" />
    </Page>
  )
}
