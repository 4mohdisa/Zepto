/**
 * Testimonials Data
 * 
 * User testimonials displayed on the landing page.
 * Each testimonial includes user details and their profile picture.
 */

export interface Testimonial {
  id: string
  name: string
  initials: string
  quote: string
  photoUrl: string
}

export const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Kim',
    initials: 'SK',
    quote: 'Saved over $1,200 in my first 3 months by identifying recurring charges I didn\'t even know about. This tool pays for itself 20x over.',
    photoUrl: '/Users/Sarah-Kim.jpeg'
  },
  {
    id: '2',
    name: 'Michael Johnson',
    initials: 'MJ',
    quote: 'Finally hit my savings goal after years of trying. The analytics showed me exactly where my money was going. Worth every penny.',
    photoUrl: '/Users/Michael-Johnson.jpeg'
  },
  {
    id: '3',
    name: 'Emma Patel',
    initials: 'EP',
    quote: 'As a freelancer with irregular income, Zepto\'s insights helped me budget properly for the first time. Game-changer for my business.',
    photoUrl: '/Users/Emma-Patel.jpeg'
  },
  {
    id: '4',
    name: 'Alex Chen',
    initials: 'AC',
    quote: 'Canceled 7 subscriptions I forgot about. That\'s $84/month back in my pocket. Zepto found money I didn\'t know I was losing.',
    photoUrl: '/Users/Sarah-Kim.jpeg'
  },
  {
    id: '5',
    name: 'Jessica Davis',
    initials: 'JD',
    quote: 'Reduced my spending by 35% without feeling deprived. The category insights showed me what I actually value vs wasteful spending.',
    photoUrl: '/Users/Jessica-Davis.jpeg'
  }
]

