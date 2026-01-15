import { getPostBodySummary } from './post-body-summary'

describe('postBodySummary', () => {
  describe('basic text processing', () => {
    it('should return empty string for empty body', () => {
      const input = {
        author: 'foo81',
        permlink: 'bar81',
        last_update: '2019-05-10T09:15:21',
        body: ''
      }
      const expected = ''
      expect(getPostBodySummary(input)).toBe(expected)
    })

    it('should remove HTML tags', () => {
      const input = {
        author: 'foo82',
        permlink: 'bar82',
        last_update: '2019-05-10T09:15:21',
        body: '<center>Lorem Ipsum Dolor</center>'
      }
      const expected = 'Lorem Ipsum Dolor'
      expect(getPostBodySummary(input)).toBe(expected)
    })

    it('should remove new line characters', () => {
      const input = {
        author: 'foo83',
        permlink: 'bar83',
        last_update: '2019-05-10T09:15:21',
        body: 'Lorem \n Ipsum \n Dolor'
      }
      const expected = 'Lorem Ipsum Dolor'
      expect(getPostBodySummary(input)).toBe(expected)
    })

    it('should trim leading and trailing whitespace', () => {
      const input = {
        author: 'foo84',
        permlink: 'bar84',
        last_update: '2019-05-10T09:15:21',
        body: '   Lorem Ipsum Dolor     '
      }
      const expected = 'Lorem Ipsum Dolor'
      expect(getPostBodySummary(input)).toBe(expected)
    })

    it('should remove URLs from text', () => {
      const input = {
        author: 'foo85',
        permlink: 'bar85',
        last_update: '2019-05-10T09:15:21',
        body: 'Lorem http://lorem.com Ipsum Dolor https://ipsum.com'
      }
      const expected = 'Lorem Ipsum Dolor'
      expect(getPostBodySummary(input)).toBe(expected)
    })

    it('should normalize multiple whitespaces to single space', () => {
      const input = {
        author: 'foo86',
        permlink: 'bar86',
        last_update: '2019-05-10T09:15:21',
        body: '   Lorem       Ipsum      Dolor     '
      }
      const expected = 'Lorem Ipsum Dolor'
      expect(getPostBodySummary(input)).toBe(expected)
    })

    it('should decode HTML entities', () => {
      const input = 'http://lorem.com Lorem &lt; Ipsum &amp; Dolor &euro;	'
      const expected = 'Lorem < Ipsum & Dolor €'
      expect(getPostBodySummary(input)).toBe(expected)
    })
  })

  describe('with length limits', () => {
    it('should limit output to specified character length', () => {
      const input = {
        author: 'foo87',
        permlink: 'bar87',
        last_update: '2019-05-10T09:15:21',
        body: 'lorem ipsum dolor sit amet'
      }
      const expected = 'lorem ipsum dolor sit'
      expect(getPostBodySummary(input, 20)).toBe(expected)
    })

    it('should process long markdown content and apply length limit', () => {
      const input = {
        author: 'foo88',
        permlink: 'bar88',
        last_update: '2019-05-10T09:15:21',
        body: `https://youtu.be/DII2VTXDP7A
In this post, we want to bring you up to speed on what is happening inside Steemit, as well as give you our perspective on the successes (and failures) of the past year, let you know what we see as our mission going forward, and provide some insight into what we have planned.
<h1>Steemit's Vision and Mission</h1>
Through our vision of **empowering entrepreneurs to tokenize the internet**, our primary roles in the Steem ecosystem are providing the community with software enhancements to the Steem blockchain, modular framework applications made up of components that can be leveraged by application developers and inspiration through these platforms to entrepreneurial end-users. We believe we must build in ways that create as many opportunities — and catalyze as many amazing Steem-based entrepreneurs and communities — as possible.`
      }

      const expected = 'In this post, we want to bring you up to speed on what is happening inside Steemit, as well as give you our perspective on the successes (and failures) of the past year, let you know what we see as our'
      expect(getPostBodySummary(input, 200)).toBe(expected)
    })

    it('should process complex HTML content with length limit', () => {
    const input = {
      author: 'foo89',
      permlink: 'bar89',
      last_update: '2019-05-10T09:15:21',
      body: `<html>
<center><a href='https://d.tube/#!/v/surfermarly/x2zm8s26'><img src='https://images.ecency.com/DQmdxVxFgLu8PT1TchgQUHtd7LGvKtF5u1DbHmDDKALiwxi/dreamsd1.jpg'></a></center><hr>
<p><b>Everybody has a dream. Most of the time it takes us a while to turn these great wishes into reality, especially   because they usually come with a bigger     price tag.</b></p>
<p>Now thanks to Steem some of us will be able to cut corners in order to achieve their goals more quickly. The additional income can be a game changer to many players.</p>
<p>My Steem earnings enabled me to buy a piece of land where I'll build my first own house. Writing down these words still seems a bit unreal to me, since I didn't believe to come to that point so quickly.</p>
<h3>Click on the above image or <a href='https://d.tube/#!/v/surfermarly/x2zm8s26'>HERE ▶️</a> to watch my video statement.</h3>
<p>Without hard work and dedication as well as the great support from the community this wouldn't have been possible. Also the timing was brilliant, I joined in the earlier stages.</p>
<p><b>I'm both grateful and proud.</b></p>
<p>Many people supported me along the way, some tried to tear me down. I'm glad I only stayed with those who pushed me, they have a large stake in my success story.</p></html>`
    }

    const expected = 'Everybody has a dream. Most of the time it takes us a while to turn these great wishes into reality, especially because they usually come with a bigger price tag. Now thanks to Steem some of us will be'
      expect(getPostBodySummary(input, 200)).toBe(expected)
    })

    it('should extract summary from markdown with headings and formatting', () => {
    const input = {
      author: 'foo90',
      permlink: 'bar90',
      last_update: '2019-05-10T09:15:21',
      body: `<center><a href='https://d.tube/#!/v/marpemusic/gi5e9yrl'><img src='https://ipfs.io/ipfs/QmYK5yzDHyoDVQQ5xgV4RLzcZz5Qy95Hz1n6qbEusJGHYB'></a></center><hr>
![DTUBE.jpg](https://res.cloudinary.com/hpiynhbhq/image/upload/v1519196266/ebleqjokesumzw3mwpcz.jpg)
###### Hey   Dtube!
###### Hey   Steemian
###### It's your boy marpe @marpemusic. I greet you from my stable, Ibadan Nigeria.
**There's excitement in the air! The epoch making STEEMIB (that is, STEEMIT IBADAN) meet up is around the corner!! Where would you rather be on the 24th of February 2018? You don't want to miss this peeps.**
![meet up.jpeg](https://res.cloudinary.com/hpiynhbhq/image/upload/v1519196411/ihzgikihusxnazqpzltr.jpg)
### Boooommm!!!
I'm giving Three DTUBE & STEEMIT BRANDED TEES to three people for free. Yes, for free. *E fit be you ooo!*
So, how can you qualify to get one?`
    }

    const expected = 'Hey Dtube! Hey Steemian It\'s your boy marpe @marpemusic. I greet you from my stable, Ibadan Nigeria. There\'s excitement in the air! The epoch making STEEMIB (that is, STEEMIT IBADAN) meet up is around'

      expect(getPostBodySummary(input, 200)).toBe(expected)
    })
  })

  describe('with string input', () => {
    it('should process string input instead of object', () => {
      const input = '<center>Lorem Ipsum Dolor</center>'
      const expected = 'Lorem Ipsum Dolor'
      expect(getPostBodySummary(input)).toBe(expected)
    })
  })
})
