export const dynamic = 'force-dynamic'

import DateHeader from '@/components/DateHeader'
import SportCard from '@/components/SportCard'
import FoodCard from '@/components/FoodCard'
import HabitsRow from '@/components/HabitsRow'

export default function HomePage() {
  return (
    <main className="flex flex-col gap-4 pb-8">
      <DateHeader />
      <div className="flex flex-col gap-4 px-4">
        <SportCard />
        <FoodCard />
      </div>
      <HabitsRow />
    </main>
  )
}
