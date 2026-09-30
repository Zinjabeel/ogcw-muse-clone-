import type { StoryText } from "./index";
import wylePhoto from "../../assets/news/noah-wyle.jpg";
import seehornPhoto from "../../assets/news/rhea-seehorn.jpg";
import venicePhoto from "../../assets/news/venice-red-carpet.jpg";

// Culture stories in full.

export const CULTURE_STORIES: Record<string, StoryText> = {
  "paris-fashion-week-ss27": {
    body: [
      { type: "p", text: "Paris Fashion Week opened on Monday 28 September with around 100 houses on the spring/summer 2027 calendar, roughly two-thirds of them staging runway shows and the rest presentations. Over nine days, to Tuesday 6 October, it is the biggest week of the season, and the one the rest of fashion takes its cues from." },
      { type: "p", text: "The Belgian designer Julie Kegels opened the week on Monday afternoon. From there the schedule builds to a run of the biggest houses in the world, with two designer debuts in the middle of the week." },
      { type: "facts", title: "Paris Fashion Week SS27", items: [["Dates", "Monday 28 September to Tuesday 6 October"], ["Houses", "About 100, two-thirds of them showing on the runway"], ["Opened by", "Julie Kegels, Monday 28 September"], ["Debuts", "Drew Henry at Courrèges, Kai Nesselrath at Carven"], ["Organised by", "The Fédération de la Haute Couture et de la Mode"], ["Watch", "Livestreams of selected shows"]] },
      { type: "h2", text: "The shows to watch" },
      { type: "list", items: ["Dior, by Jonathan Anderson: Tuesday 29 September, 2:30pm", "Courrèges, Drew Henry’s debut: Wednesday 30 September, 10:30am", "Carven, Kai Nesselrath’s debut: Thursday 1 October, 12:30pm", "Balenciaga, by Pierpaolo Piccioli: Thursday 1 October, 2pm", "Hermès: Saturday 3 October, 12pm", "Miu Miu: Sunday 4 October, 1pm", "Valentino: Sunday 4 October, 3:30pm", "Chanel, by Matthieu Blazy: Monday 5 October, 8pm", "Louis Vuitton: Tuesday 6 October, 6:30pm"] },
      { type: "p", text: "Tuesday 29 September is the heaviest day of the schedule, with Christian Dior in the afternoon and Saint Laurent in the evening. Sunday 4 October is the Italian afternoon, with Miu Miu and Valentino back to back." },
      { type: "h2", text: "Two debuts" },
      { type: "p", text: "The season’s newcomers show midweek. Drew Henry, the South African designer who previously worked at Burberry and JW Anderson, presents his first Courrèges collection on Wednesday 30 September. Kai Nesselrath, formerly head of womenswear design at Saint Laurent, makes his Carven debut on Thursday 1 October." },
      { type: "p", text: "Debuts are what people come to fashion week for. A first collection sets out how a new designer reads a house’s past, and the reviews that follow can shape a label for years." },
      { type: "quote", text: "Two first collections, and a week that ends with Louis Vuitton." },
      { type: "h2", text: "Also on the calendar" },
      { type: "p", text: "Hermès, Givenchy, Chloé, Miu Miu, Maison Margiela, Dries Van Noten, Balmain, Stella McCartney and Tom Ford are all on the official schedule. For new names, the Fédération’s SPHERE showroom, run since 2020, presents a curated selection of nine emerging brands this season." },
      { type: "h2", text: "How the calendar works" },
      { type: "p", text: "The official calendar, set by the Fédération de la Haute Couture et de la Mode, splits into shows and presentations. Shows are runway events, often livestreamed; presentations show the collection in a room or on film. There are also plenty of events off the official calendar across the city." },
      { type: "checklist", title: "Following from home, or in Paris? What to know", items: [
        "Runway shows are invitation-only, but many are livestreamed on the Fédération’s website and on each house’s own channels.",
        "Show times are Paris time (CEST): convert before you tune in.",
        "In Paris, the crowds and street-style photographers gather outside the venues; arrive early and keep to the pavement.",
        "The runway images and reviews usually arrive within hours of each show.",
      ] },
      { type: "h2", text: "Questions and answers" },
      { type: "faq", items: [
        ["Can the public attend Paris Fashion Week?", "The shows are for invited guests: press, buyers and clients. Many are livestreamed for everyone else."],
        ["Which shows are debuts?", "Drew Henry’s first Courrèges collection on 30 September, and Kai Nesselrath’s first Carven collection on 1 October."],
        ["When does it end?", "On Tuesday 6 October, with Louis Vuitton among the final shows."],
      ] },
    ],
  },

  "avengers-endgame-encore-box-office": {
    ask: "Would you see Endgame in a cinema again?",
    body: [
      { type: "p", text: "Avengers: Endgame is back at the top of the North American box office. The Encore re-release took $26.1 million over the weekend of 25 to 27 September, making it the first re-release to finish number one since The Lion King in 3D in 2011." },
      { type: "p", text: "Seven years after it first came out, in April 2019, a film everyone has already seen beat every new release in the country. It was a strong weekend all round, with three films taking more than $20 million each." },
      { type: "facts", title: "The weekend", items: [["Dates", "25 to 27 September 2026"], ["No. 1", "Avengers: Endgame Encore, $26.1 million"], ["Record", "First re-release at No. 1 since The Lion King (3D) in 2011"], ["Endgame’s first run", "April 2019"]] },
      { type: "h2", text: "A record-breaking year for Spider-Man" },
      { type: "p", text: "The Encore arrives at the end of a huge few months for Marvel. Spider-Man: Brand New Day opened on the weekend of 31 July to 2 August with $360.1 million, including the biggest opening day and the biggest single day of all time, $169.8 million. It led the box office for six weekends in a row." },
      { type: "p", text: "In August it passed Endgame’s own North American total of $858.4 million, and on the weekend of 18 to 20 September it passed the $936.6 million of Star Wars: The Force Awakens to become the highest-grossing film ever in the United States and Canada. It has now taken more than $950 million there." },
      { type: "list", items: ["Spider-Man: Brand New Day: about $951 million, the year’s biggest film", "The Odyssey: about $617 million", "Toy Story 5: about $480 million"] },
      { type: "h2", text: "The weeks around it" },
      { type: "p", text: "The weekend before the Encore, Resident Evil opened at number one with $60.2 million. A week earlier, Practical Magic 2 had ended Spider-Man’s run at the top with $30 million." },
      { type: "h2", text: "Endgame the first time round" },
      { type: "p", text: "When Avengers: Endgame opened in April 2019 it broke almost every box office record there was, including the biggest opening weekend of all time in North America at the time, more than $357 million. It went on to take nearly $2.8 billion worldwide, and for a while it was the highest-grossing film ever made." },
      { type: "p", text: "Its North American total, $858.4 million, stood as Marvel’s best until this summer, when Spider-Man: Brand New Day passed it. That the older film could then return and top the chart again says a lot about how much it still means to audiences." },
      { type: "h2", text: "Why re-releases are back" },
      { type: "p", text: "A film like Endgame is a shared memory as much as a movie, and seeing it again with a full cinema is a different experience from watching it at home. Anniversary runs also give cinemas a proven title in weeks with fewer big new releases, which is why studios keep bringing their biggest films back." },
      { type: "quote", text: "A seven-year-old film, back at number one." },
      { type: "h2", text: "Questions and answers" },
      { type: "faq", items: [
        ["What is the highest-grossing film ever in the US and Canada?", "Spider-Man: Brand New Day, which passed Star Wars: The Force Awakens in September 2026."],
        ["When was the last time a re-release topped the box office?", "The Lion King in 3D, in 2011."],
        ["How can I find a screening?", "Check your local cinema’s listings for Avengers: Endgame Encore."],
      ] },
    ],
  },

  "sneaker-drops-late-september-2026": {
    ask: "Did you pick up anything this week?",
    body: [
      { type: "p", text: "September ends with one of the busiest release weeks of the year: a Bad Bunny adidas, a streamer’s own signature Harden, Jordan retros, a Mowalola collaboration and a recovery slide made with Hyperice. Here is everything that dropped from Friday 25 to Tuesday 29 September, and where to find it." },
      { type: "facts", title: "The week’s releases", items: [["Friday 25 September", "Nike Ja 4 “Deep Water”, Air Jordan 5 “Sunset”, adidas Harden Vol. 10 “RUEI”"], ["Saturday 26 September", "adidas BadBo 1.0 “Night Navy”, Air Jordan 1 Low OG “Last Dance at the Garden”, Mowalola x Air Jordan 14"], ["Tuesday 29 September", "Nike Air Bakin OG “Varsity Red”, Nike Air Zoom Hyperslide with Hyperice"]] },
      { type: "h2", text: "Friday: Ja, Jordan and a Harden for Rayasianboy" },
      { type: "p", text: "On Friday 25 September the Air Jordan 5 “Sunset” arrived in white and sunset tones at general retailers, alongside Ja Morant’s Nike Ja 4 in “Deep Water” at Foot Locker. The one that got people talking was the adidas Harden Vol. 10 “RUEI”, a pink colourway made with the streamer Rayasianboy and released through adidas." },
      { type: "h2", text: "Saturday: Bad Bunny’s BadBo" },
      { type: "p", text: "Saturday brought Bad Bunny’s adidas BadBo 1.0 in “Night Navy” (style code LB5996), the latest in his long-running partnership with adidas. The Air Jordan 1 Low OG “Last Dance at the Garden” dropped the same day, along with a Mowalola x Air Jordan 14 from the London designer Mowalola, at select retailers worldwide." },
      { type: "h2", text: "Tuesday: Air Bakin and Hyperslides" },
      { type: "p", text: "On Tuesday 29 September Nike reissued the Air Bakin OG in “Varsity Red”, and released the Air Zoom Hyperslide, a recovery slide made with Hyperice, the company best known for its massage and recovery devices. Earlier in the month, Anthony Edwards’ adidas AE 3 made its debut on 18 September." },
      { type: "checklist", title: "How to buy a limited release: what to prepare", items: [
        "Download the brand’s app (Nike SNKRS, the adidas app) and turn on notifications for the drop.",
        "Save your size, delivery address and payment details in the app before release day.",
        "Know the release time in your country; many drops go live early in the morning.",
        "Enter raffles at trusted retailers for the most limited pairs.",
        "Buying resale? Use a platform that authenticates pairs, and be wary of prices that look too good.",
      ] },
      { type: "h2", text: "Questions and answers" },
      { type: "faq", items: [
        ["Where can I buy the Bad Bunny BadBo 1.0 “Night Navy”?", "It released through adidas on 26 September, style code LB5996. After release, look for restocks on adidas or authenticated resale platforms."],
        ["What is the difference between a general release and a limited one?", "A general release is stocked widely, in many stores and sizes. Limited releases come in small numbers, often through app draws or raffles, and sell out fast."],
        ["Who is Rayasianboy?", "A streamer, and the collaborator behind the adidas Harden Vol. 10 “RUEI” colourway."],
        ["Which release is hardest to find?", "The Mowalola x Air Jordan 14, which went only to select retailers worldwide rather than on general release."],
        ["What is the Hyperslide?", "The Nike Air Zoom Hyperslide, a recovery slide made with Hyperice, released on 29 September."],
      ] },
      { type: "p", text: "Want the classics instead? The OGCW Shop has our picks from Nike, Adidas, StockX and Uniqlo." },
    ],
  },

  "emmys-2026-winners": {
    body: [
      { type: "p", text: "The Pitt won Outstanding Drama Series for the second year running at the 78th Primetime Emmy Awards on 14 September, and Noah Wyle again won Lead Actor in a Drama Series. But the biggest winner of the night was Apple TV’s Widow’s Bay, with 14 Emmys, more than any other show, including Outstanding Comedy Series." },
      { type: "p", text: "Mariska Hargitay hosted the ceremony at the Peacock Theater in Los Angeles, the first host who is not a comedian since Angela Lansbury in 1993, and the first woman to host since Jane Lynch in 2011. It aired on NBC and streamed on Peacock, and drew 6.8 million viewers." },
      { type: "facts", title: "The 78th Emmys", items: [["Date and venue", "14 September 2026 · Peacock Theater, Los Angeles"], ["Host", "Mariska Hargitay"], ["Broadcast", "NBC and Peacock · 6.8 million viewers"], ["Most nominations", "The Pitt, 25"], ["Most wins", "Widow’s Bay, 14"], ["Top network", "Apple TV, 28 wins"]] },
      { type: "h2", text: "The big three" },
      { type: "list", items: ["Drama Series: The Pitt (HBO Max)", "Comedy Series: Widow’s Bay (Apple TV)", "Limited or Anthology Series: DTF St. Louis (HBO)"] },
      { type: "h2", text: "The acting winners" },
      { type: "images", photos: [{ src: wylePhoto, alt: "Noah Wyle smiling at his Hollywood Walk of Fame ceremony", credit: "Kevin Paul, CC BY 4.0", crop: { pos: "50% 30%" } }, { src: seehornPhoto, alt: "Rhea Seehorn speaking on a convention panel", credit: "Gage Skidmore, CC BY-SA 2.0", crop: { pos: "55% 30%" } }], caption: "Noah Wyle won for The Pitt again; Rhea Seehorn won her first Emmy, for Pluribus." },
      { type: "list", items: ["Lead Actor, Drama: Noah Wyle, The Pitt", "Lead Actress, Drama: Rhea Seehorn, Pluribus", "Lead Actor, Comedy: Matthew Rhys, Widow’s Bay", "Lead Actress, Comedy: Jean Smart, Hacks", "Lead Actor, Limited Series: Matthew Rhys, The Beast in Me", "Lead Actress, Limited Series: Sally Field, Remarkably Bright Creatures", "Supporting Actor, Drama: Tom Pelphrey, Task", "Supporting Actress, Drama: Allison Janney, The Diplomat", "Supporting Actor, Comedy: Stephen Root, Widow’s Bay", "Supporting Actress, Comedy: Kate O’Flynn, Widow’s Bay"] },
      { type: "p", text: "Matthew Rhys won twice, for Widow’s Bay and for The Beast in Me. Rhea Seehorn’s win for Pluribus is her first Emmy, after earlier nominations for Better Call Saul, and Vince Gilligan, who created Pluribus and co-created Better Call Saul, won the drama writing award for it." },
      { type: "h2", text: "Behind the camera" },
      { type: "list", items: ["Directing, Drama: Saul Metzstein, Slow Horses", "Directing, Comedy: Hiro Murai, Widow’s Bay", "Writing, Drama: Vince Gilligan, Pluribus", "Writing, Comedy: Katie Dippold, Widow’s Bay", "Reality Competition: The Traitors", "Variety Series: The Late Show with Stephen Colbert", "Bob Hope Humanitarian Award: Michael J. Fox"] },
      { type: "h2", text: "A shorter show, and a row" },
      { type: "p", text: "This year the Television Academy moved five categories to the Creative Arts ceremonies, cutting the televised awards from 26 to 19. Unions criticised the change, saying it devalued the work of the people whose awards were moved off the main broadcast." },
      { type: "h2", text: "Questions and answers" },
      { type: "faq", items: [
        ["Who hosted the Emmys?", "Mariska Hargitay, the first host who is not a comedian since Angela Lansbury in 1993."],
        ["Where can I watch the 2026 Emmys?", "The ceremony aired on NBC and streamed on Peacock."],
        ["Which show won the most Emmys?", "Widow’s Bay, with 14, including Outstanding Comedy Series."],
        ["Did The Pitt win again?", "Yes. It won Outstanding Drama Series for the second year in a row, and Noah Wyle won Lead Actor in a Drama Series again."],
      ] },
    ],
  },

  "venice-2026-woman-unknown-golden-lion": {
    body: [
      { type: "p", text: "Woman Unknown, directed by May el-Toukhy, won the Golden Lion at the 83rd Venice Film Festival on 12 September. The psychological thriller is set in Denmark in the summer of 1945, just after the war, and it was one of only two films directed by women in the main competition." },
      { type: "p", text: "It also won the best actress prize, the Volpi Cup, for Mathilde Arcel, who plays the nanny and housemaid Marie. Accepting the Golden Lion, el-Toukhy spoke about the lack of equal opportunities for women who make films." },
      { type: "facts", title: "Venice 2026", items: [["Dates", "2 to 12 September 2026"], ["Jury president", "Maggie Gyllenhaal"], ["Opening film", "Ink, by Danny Boyle"], ["Golden Lion", "Woman Unknown, May el-Toukhy (Denmark, Sweden, Latvia)"], ["Lifetime achievement", "Ellen Burstyn and George Clooney"]] },
      { type: "h2", text: "Who May el-Toukhy is" },
      { type: "p", text: "The Danish director is best known internationally for Queen of Hearts, her 2019 drama. Woman Unknown is a co-production between Denmark, Sweden and Latvia, and its win puts a Scandinavian film at the top of one of the world’s three biggest festivals." },
      { type: "h2", text: "All the winners" },
      { type: "list", items: ["Golden Lion: Woman Unknown, May el-Toukhy", "Grand Jury Prize: Possible Love, Lee Chang-dong", "Silver Lion for best director: Ilya Khrzhanovsky, DAU", "Best actress: Mathilde Arcel, Woman Unknown", "Best actor: John Malkovich, Wild Horse Nine", "Best screenplay: Coralie Amedeo, Stéphane Brizé and Olivier Gorce, A Good Little Soldier", "Marcello Mastroianni Award: Malou Khebizi, A Place to Heal", "Special Jury Prize: Yuval Abraham and Rachel Szor, NAZA"] },
      { type: "image", photo: { src: venicePhoto, alt: "The red carpet and a row of flags outside the Palazzo del Cinema in Venice", credit: "Pietro Luca Cassarino, CC BY-SA 2.0", crop: { pos: "50% 50%" } }, caption: "The red carpet outside the Palazzo del Cinema on the Lido." },
      { type: "h2", text: "The jury" },
      { type: "p", text: "Maggie Gyllenhaal led the jury, with Kaouther Ben Hania, Daniel Blumberg, Francesco Casetti, Xavier Giannoli, Shahrbanoo Sadat and Johnnie To." },
      { type: "h2", text: "Orizzonti" },
      { type: "list", items: ["Best film: Diane in the Loop, Ann Sirot and Raphaël Balboni", "Best director: Jacqueline Lentzou", "Best actress: Laleh Marzban, Falling House", "Best actor: Riccardo Scamarcio, Children of the Monkey"] },
      { type: "h2", text: "Why Venice matters" },
      { type: "p", text: "Venice is the oldest film festival in the world and, with Cannes and Berlin, one of the three that matter most. Coming at the end of the summer, it has also become the starting line for awards season: films that premiere on the Lido often go on to the Oscars the following spring, which is why a Golden Lion can change a film’s fortunes overnight." },
      { type: "p", text: "For Woman Unknown, the prize means attention from distributors and audiences far beyond Scandinavia, and it adds a best actress win for Mathilde Arcel to the film’s story." },
      { type: "h2", text: "A festival with a debate" },
      { type: "p", text: "The selection sparked debate this year. Industry figures signed open letters about Palestinian representation and the festival’s policies, which kept politics part of the conversation on the Lido throughout the ten days." },
      { type: "quote", text: "One of two films by women in competition, and the one that won." },
      { type: "h2", text: "Questions and answers" },
      { type: "faq", items: [
        ["What is the Golden Lion?", "The top prize at the Venice Film Festival, given to the best film in the main competition."],
        ["When can I see Woman Unknown?", "No release dates had been announced at the time of writing. Festival winners usually reach cinemas in the months that follow."],
        ["Who won best actor?", "John Malkovich, for Wild Horse Nine."],
      ] },
    ],
  },
};
