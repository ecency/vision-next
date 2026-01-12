import { catchPostImage } from './catch-post-image'

describe('catchPostImage', () => {
  it('1- Should extract entry image from json_metadata', () => {
    const input = {
      author: 'foo1',
      permlink: 'bar1',
      json_metadata:
        '{"tags":["auto","vehicle","ai","technology","adsactly"],"users":["adsactly","techblogger","adsactly-witness"],"image":["http://www.autonews.com/apps/pbcsi.dll/storyimage/CA/20180205/MOBILITY/180209919/AR/0/AR-180209919.jpg","http://clipart-library.com/images/pco56kbxi.png","http://psipunk.com/wp-content/uploads/2010/03/phoenix-electric-car-futuristic-concept-01.jpg","https://images.hgmsites.net/med/2011-honda-small-sports-ev-concept_100369472_m.jpg","https://cdn.trendhunterstatic.com/thumbs/electric-car-concept.jpeg","https://s.aolcdn.com/hss/storage/midas/162bec06fe31386c2a36ad6ca4d7f01d/205983934/lg-here-self-driving-car-partnership.jpg","https://images.ecency.com/DQmd5CQG5zLjjm2z8289qcLU6eBHJpC5FmgtR3aC1eXnhsi/Adsactly-Logo-200px.png","https://images.ecency.com/0x0/https://images.ecency.com/DQmWK9ACVoywHPBJQdoTuJpoTSoaubBSKSAdZaJtw1cfLb9/adsactlywitness.gif"],"links":["https://qzprod.files.wordpress.com/2018/02/kelly-sikkema-266805.jpg?quality=80&strip=all&w=3200","http://psipunk.com/wp-content/uploads/2010/03/phoenix-electric-car-futuristic-concept-01.jpg","https://images.hgmsites.net/med/2011-honda-small-sports-ev-concept_100369472_m.jpg","https://cdn.trendhunterstatic.com/thumbs/electric-car-concept.jpeg","https://s.aolcdn.com/hss/storage/midas/162bec06fe31386c2a36ad6ca4d7f01d/205983934/lg-here-self-driving-car-partnership.jpg","https://discord.gg/EwGhEzb","https://steemit.com/witness-category/@adsactly-witness/adsactly-steemit-witness-proposal","https://steemit.com/~witnesses","https://v2.steemconnect.com/sign/account-witness-vote?witness=adsactly-witness&approve=1"],"app":"steemit/0.1","format":"markdown"}',
      body: '',
      last_update: '2019-05-10T09:15:21'
    }

    const expected = 'https://images.ecency.com/p/2N61tysBoFrHXFxZDViD89h3bB1XeSgVQ4AKkLUBP2yqmAVL2ZqehqfzwxCQq2g82mHjH9LZV4ugYdmL4TbpNqAoc5LaDDRVPYNurZeK7HpTFq6fjtFG1s9ZpXZWuCufpLhZsDw1G1wL.png?format=match&mode=fit'

    expect(catchPostImage(input)).toBe(expected)
  })

  it('2- Should extract entry image from json_metadata', () => {
    const input = {
      author: 'foo2',
      permlink: 'bar2',
      json_metadata:
        '{"community":"busy","app":"busy/2.3.0","format":"markdown","users":["gavvet","kingscrown","vcelier","ezzy","meesterboom","thecryptodrive","reggaemuffin","adsactly","adsactly-witness","buildteam","minnowbooster","steemvoter","steemsports"],"links":["https://imgur.com/NUt92kg","/@gavvet","/@kingscrown","/@vcelier","/@ezzy","/@meesterboom","/@thecryptodrive","/@reggaemuffin","/@adsactly","/@adsactly-witness"],"image":["https://images.ecency.com/0x0/https://i.imgur.com/NUt92kg.jpg","https://images.ecency.com/0x0/https://images.ecency.com/DQmXndfFUQmmtMk5Dd6u1nRNmNqr2mdkEGDVkT9SNyCxEeP/bt%20logo.png","https://images.ecency.com/0x0/https://images.ecency.com/DQmd5CQG5zLjjm2z8289qcLU6eBHJpC5FmgtR3aC1eXnhsi/Adsactly-Logo-200px.png"],"tags":["art","photography","adsactly","thoughts","busy"]}',
      body: '',
      last_update: '2019-05-10T09:15:21'
    }

    const expected = 'https://images.ecency.com/p/2bP4pJr4wVimqCWjYimXJe2cnCgnAvKo1Rap9w75mXk.png?format=match&mode=fit'

    expect(catchPostImage(input)).toBe(expected)
  })

  it('3- Should extract nothing from json_metadata because there is no image field ', () => {
    const input = {
      author: 'foo3',
      permlink: 'bar3',
      json_metadata:
        '{"video":{"info":{"title":"HEALTHY SERIES | LUNCH | STUFFED AUBERGINE BOATS - VIDEO ","snaphash":"QmdbBjr9bhab392f2zkXsa7YhHue7YNch2J1XXzvhLEE6V","author":"allasyummyfood","permlink":"qe5nlzmj","duration":172.384943,"filesize":26936060,"spritehash":"QmSG49VefmCQqWVjb8ii79GQVuSSKrFrUNSh45gni5Kqhq"},"content":{"videohash":"QmRkNLhhBjr86YB21ZpD76A1jCDt7stCAMeNpWgxNYRmUs","video480hash":"QmP3S6piVPRuriPmQZRbPPHGYG5aKYjukFP8vWWcW349VQ","magnet":"","description":"How to make stuffed eggplant. Looking for a flavorful dinner? Then try this baked eggplant dish that\'s stuffed with vegetables and spices. Make the most of whole aubergines - turn them into edible bowls. Serve these stuffed aubergines as a light dinner along with a big salad. This is very hearty and nutritious dish.\\n\\nIngredients \\n\\n\\n1 large aubergine\\n1 cup - 200 gr of chopped canned tomato\\n1 tsp of turmeric and 1tsp of cumin\\nhalf an onion\\n2 cloves of garlic\\nbunch of parsley\\nsalt & pepper\\nsour cream ( optional)\\n\\nDirections \\n\\nStep 1: Preheat your oven to 180 C or 350 F.\\nStep 2 : Cut your eggplant in half, make few cuts along and then across. \\nStep 3 : Place your eggplant onto a baking dish, blush them with olive oil or use low calorie cooking spray. \\nStep 4 : Cook your eggplant for 30-35 min. \\nStep 5 : In a small saucepan, place your chopped onion and garlic. Fry for 3 -5 min untill soft. Add turmeric and cumin. Then add chopped tomatoes, \\nStep 6 : Scoop the mixture from your eggplant very carefully without breaking the skin. \\nStep 7 : Add the eggplant flesh into your pan along with parsley and cook for 15 min on low heat.\\nStep 8 : Fill your eggplant boats and serve with some fresh sour cream. \\n\\nMore videos on @dtube!!! :))) Alla \\n","tags":["dtube","video","food","recipe"]},"_id":"d46a5cfac370f095a54e6aa088656d7e"},"tags":["dtube","video","food","recipe","dtube"],"app":"dtube/0.6"}',
      body: '',
      last_update: '2019-05-10T09:15:21'
    }
    expect(catchPostImage(input)).toBe(null)
  })

  it('4- Should extract entry image from image link', () => {
    const input = {
      author: 'foo4',
      permlink: 'bar4',
      json_metadata: '{}',
      body: '<center>https://ipfs.io/ipfs/aa.png</center><hr>',
      last_update: '2019-05-10T09:15:21'
    }

    const expected = 'https://images.ecency.com/p/F7pXcna7voXwGzRSmsevszxeTZTcnhJVu7akN.png?format=match&mode=fit'

    expect(catchPostImage(input)).toBe(expected)
  })

  it('5- Should extract entry image from img tag', () => {
    const input = {
      author: 'foo5',
      permlink: 'bar5',
      body:
        '<center><a href=\'https://d.tube/#!/v/theaudgirl/2ys21z9c\'><img src=\'https://ipfs.io/ipfs/QmaG5Dpg1XGiY7EyeMCwT8Dqw4GfiAaehq3hZadongniQc\'></a></center><hr>',
      last_update: '2019-05-10T09:15:21'
    }

    const expected = 'https://images.ecency.com/p/46aP2QbqUqBqwzwxM6L1P6uLNceBDDCMCT7ReED4mRE2QxpU6UqBLE8rB5qCFGv3PRxu6pX61M3gUWVEEkTHbKBUQ2Kc.png?format=match&mode=fit'

    expect(catchPostImage(input)).toBe(expected)
  })

  it('6- Should extract entry image from markdown img tag', () => {
    const input = {
      author: 'foo6',
      permlink: 'bar6',
      json_metadata: '{}',
      body:
        '<center>![ezrni9y9pw.jpg](https://img.esteem.ws/ezrni9y9pw.jpg)</center><hr>',
      last_update: '2019-05-10T09:15:21'
    }

    const expected = 'https://images.ecency.com/p/o1AJ9qDyyJNSpZWhUgGYc3MngFqoAMxpZmncLuDWMUeztZaUN.png?format=match&mode=fit'

    expect(catchPostImage(input)).toBe(expected)
  })

  it('7- Should extract nothing', () => {
    const input = {
      author: 'foo7',
      permlink: 'bar7',
      json_metadata: '{}',
      body: '<p>lorem ipsum dolor</p> sit amet',
      last_update: '2019-05-10T09:15:21'
    }

    expect(catchPostImage(input)).toBe(null)
  })

  it('8- Test with not obj param', () => {
    const input = '<center>![ezrni9y9pw.jpg](https://img.esteem.ws/ezrni9y9pw.jpg)</center><hr>'
    const expected = 'https://images.ecency.com/p/o1AJ9qDyyJNSpZWhUgGYc3MngFqoAMxpZmncLuDWMUeztZaUN.png?format=match&mode=fit'

    expect(catchPostImage(input)).toBe(expected)
  })

  it('9- Should catch from new post style', () => {
    const input = {
      'json_metadata': {
        'image': ['https://files.peakd.com/file/peakd-hive/aggroed/agtirkG8-image.png', 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.adafruit.com%2Fblog%2Fwp-content%2Fuploads%2F2014%2F04%2Fgeordi-la-forge-600x458.jpg&amp;f=1&amp;nofb=1']
      }
    }

    const expected = 'https://images.ecency.com/p/hgjbks2vRxvf3xsYr6qQ7dm31DuBHGui8pKMdEVPxhLfEeEoVMPfUw4Z6QduNMpLay65R9vadbefhmDKmhM6HD8w8a.png?format=match&mode=fit'

    expect(catchPostImage(input as any)).toBe(expected)
  })

  it('10- Image field can contain only string ', () => {
    const input = {
      author: 'foo-10',
      permlink: 'bar-baz-10',
      json_metadata: {
        image: [
          [
            '![](https://cdn.steemitimages.com/DQmecSNtkk82zz62rymdK7wvXujn5P47zkARUMR13QLXmya/image.png)'
          ]
        ]
      }
    }
    expect(catchPostImage(input as any)).toBe('')
  })

  it('11- Image field is string', () => {
    const input = {
      'json_metadata': {
        'image': 'https://files.peakd.com/file/peakd-hive/aggroed/agtirkG8-image.png'
      }
    }
    const expected = 'https://images.ecency.com/p/hgjbks2vRxvf3xsYr6qQ7dm31DuBHGui8pKMdEVPxhLfEeEoVMPfUw4Z6QduNMpLay65R9vadbefhmDKmhM6HD8w8a.png?format=match&mode=fit'
    expect(catchPostImage(input as any)).toBe(expected)
  })
})
