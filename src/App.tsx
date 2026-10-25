import { Experience } from './scene/Experience'
import { TitleScreen } from './ui/TitleScreen'
import { Hud } from './ui/Hud'
import { CountrySearch } from './ui/CountrySearch'
import { CountryTooltip } from './ui/CountryTooltip'
import { ZonePanel } from './ui/ZonePanel'
import { Loader } from './ui/Loader'

export default function App() {
  return (
    <main className="relative h-full w-full">
      <div className="absolute inset-0">
        <Experience />
      </div>
      <div className="pointer-events-none absolute inset-0">
        <TitleScreen />
        <Hud />
        <CountrySearch />
        <ZonePanel />
        <Loader />
      </div>
      <CountryTooltip />
    </main>
  )
}
