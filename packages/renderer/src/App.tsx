import React, { memo } from "react";
import { EcencyRenderer as ER } from "./lib";
import "./lib/ecency-renderer.scss";

const EcencyRenderer = memo(ER);

export function App() {
  const demo = [
    [
      "Hive post",
      "Hello world!\n\nhttps://ecency.com/hive-125125/@ecency/ecency-year-in-rewiew-2024",
    ],
    [
      "Zoom image",
      "This is a test post(updated)(2x)\n\n\n![my cat is here](https://images.ecency.com/DQmfMNicABD66eAmVM8E15v3z1C2Hw6pyzwHQ79imeLf5vd/img_0290.jpg)\n\nUpdate test(2x)",
    ],
    [
      "Author",
      "Hello!\n\nUsers: @ecency @demo.com @ecency.waves are top 3 users in a hive community",
    ],
    [
      "Tags",
      "Hello!\n\nTags: #hello #trending #hive #btc are the most popular tags",
    ],
    [
      "Youtube video",
      "Hello!\n\nhttps://www.youtube.com/watch?v=XN5Z88DLB8U\n",
    ],

    [
      "3Speak video",
      "<center>\n" +
        "\n" +
        "[![](https://ipfs-3speak.b-cdn.net/ipfs/bafybeig5p3f4nj5zcz2pwf7a6ipqfs7nslcchfnbrhe6n5mox245jokbjy/)](https://3speak.tv/watch?v=theycallmedan/swqpoete)\n" +
        "\n" +
        "▶️ [Watch on 3Speak](https://3speak.tv/watch?v=theycallmedan/swqpoete)\n" +
        "\n" +
        "</center>\n" +
        "\n" +
        "---\n" +
        "\n" +
        "Giving some updates, my thoughts on where we are, and updates on various projects I'm involved in.\n" +
        "\n" +
        "---\n" +
        "\n" +
        "▶️ [3Speak](https://3speak.tv/watch?v=theycallmedan/swqpoete)",
    ],
    [
      "Wave, Threads, LikeTu, testhreads posts",
      "Hello world!\n\nhttps://ecency.com/@demo.com/re-ecencywaves-2024127t153020761z\n\nhttps://inleo.io/threads/view/vimukthi/re-leothreads-2tbpqwfov?referral=vimukthi\n\nhttps://ecency.com/waves/@shamis/wave-2025116t2377298z\n",
    ],
    [
      "Twitter widget",
      "Hello world\n\nhttps://x.com/it_vicev/status/1798031021692055724",
    ],
    [
      "Hive post wrapped with something",
      `
      <sup>(Inspired by a discussion about creativity, stories, distant worlds and musical soundscapes, while listening to "Petite" by N'TO.)</sup>

---

> *[In the silent depth of a blue sea, a lonely voice sings of things that were, things that might be, and things that are yet to come. Silent, rhythmic rumbles fill the void as the majestic creature floats by a man in his airtight pod, a thin shield against the masses of water...](/shortstory/@ambifokus/quantum-whispers)*
      `,
    ],
    [
      "Different links",
      "[**Follow on X**](https://x.com/vsc_eco)\n[**Follow on Hive**](https://peakd.com/@vsc.network/)\n[**Official VSC Site**](https://vsc.eco/)\n[**Vote for our Hive Witness!**](https://vote.hive.uno/@vsc.network",
    ],
    [
      "Hive operations",
      "Reprehenderit quis ducimus nesciunt et dolor illo aliquam facere. Deserunt iure quod excepturi consequuntur accusamus. @demo.com hive://sign/op/WyJ0cmFuc2ZlciIseyJ0byI6ImtleWNoYWluIiwiYW1vdW50IjoiMC4wMDEgSElWRSIsIm1lbW8iOiIifV0. Ullam voluptatibus minima quidem vel sit nobis earum quibusdam. Minima asperiores provident dolore natus dicta molestiae quod.\n" +
        "[hive://sign/op/WyJ0cmFuc2ZlciIseyJ0byI6ImtleWNoYWluIiwiYW1vdW50IjoiMC4wMDEgSElWRSIsIm1lbW8iOiIifV0.](hive://sign/op/WyJ0cmFuc2ZlciIseyJ0byI6ImtleWNoYWluIiwiYW1vdW50IjoiMC4wMDEgSElWRSIsIm1lbW8iOiIifV0.)",
    ],
  ];
  return (
    <div className="storybook">
      {demo.map(([title, post]) => (
        <div key={title}>
          {title}
          <EcencyRenderer pure={true} className="storybook-item" value={post} />
          <EcencyRenderer className="storybook-item" value={post} />
        </div>
      ))}
    </div>
  );
}
