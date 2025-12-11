import { redirect } from 'next/navigation'

export default function HelpPage(): never {
  redirect('/help/getting-started')
}
