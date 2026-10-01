import type { StoryText } from "./index";

// Streaming stories in full: the last week of September 2026.

export const STREAMING_STORIES_2: Record<string, StoryText> = {
  "kick-partner-program-payout-fix": {
    body: [
      { type: "p", text: "Kick has admitted it underpaid some of its streamers, sent backpay and changed how its Partner Program works. Through September, creators on the Kick Partner Program (KPP) had reported lower payouts than they expected and sharp swings in their rates from one stream to the next. Kick traced the problem to an internal manual calculation error." },
      { type: "p", text: "The company says it has corrected the affected calculations and paid the difference, and it is moving the program to a new way of setting rates that should make pay steadier." },
      { type: "facts", title: "Kick’s payout fix", items: [["The problem", "Lower-than-expected payouts and rate swings in September"], ["The cause", "An internal manual calculation error"], ["The fix", "Manual backpay to affected creators through Stripe"], ["The change", "Rates now set on a rolling basis across recent streams"], ["Unchanged", "The 95/5 subscription split and tipping"]] },
      { type: "h2", text: "How the backpay works" },
      { type: "p", text: "Backpay goes to each creator’s connected Stripe account, with a confirmation email. One thing to know: the money shows up in the Stripe dashboard, not in the earnings screen on Kick itself, so creators checking only Kick may not see it. Anyone who thinks they are owed more is asked to contact Kick Support for a review of their account." },
      { type: "h2", text: "From stream by stream to rolling rates" },
      { type: "p", text: "Until now, KPP rates were worked out stream by stream, each broadcast judged on its own, which left pay exposed to one bad night. The new model looks at recent broadcast performance across several streams. Recent streams add up, and a single weaker stream has less effect on the rate." },
      { type: "list", items: ["Before: each stream set its own rate, so one quiet broadcast could drag pay down", "Now: the rate reflects a run of recent streams, smoothing out the swings", "Still the same: Kick’s 95/5 subscription split, which gives creators 95% of subscription revenue, and its tipping system"] },
      { type: "quote", text: "“We own it when we get something wrong.” Ethan Wright, Kick" },
      { type: "p", text: "Ethan Wright, Kick’s director, said the episode tested the trust creators put in the platform, and set out what that trust depends on: paying accurately every stream, owning mistakes and being open about what Kick is doing and why." },
      { type: "h2", text: "Also coming" },
      { type: "list", items: ["Better detection of view-botting and tab manipulation", "A Trust Centre explaining KPP eligibility, featuring guidelines and moderation policies"] },
      { type: "checklist", title: "A Kick partner? What to check", items: [
        "Look in your Stripe dashboard, not just Kick’s earnings page, for backpay.",
        "Check your email for the confirmation that comes with each payment.",
        "If the numbers still look wrong, contact Kick Support and ask for an account review.",
        "Read the Trust Centre when it launches, especially the eligibility rules.",
      ] },
      { type: "h2", text: "Questions and answers" },
      { type: "faq", items: [
        ["Why were Kick payouts lower in September?", "Kick says an internal manual calculation error caused lower payouts and rate swings for some partners."],
        ["How do I get my backpay?", "It is sent automatically to your connected Stripe account, with a confirmation email."],
        ["Has Kick’s subscription split changed?", "No. Creators still get 95% of subscription revenue."],
        ["What is the new rate model?", "Rates are now based on recent performance across several streams rather than each stream on its own."],
      ] },
    ],
  },

  "wwe-main-event-moves-to-rumble": {
    ask: "Will you watch Main Event on Rumble?",
    body: [
      { type: "p", text: "WWE is moving Main Event, its weekly digital show, from YouTube to Rumble. From Wednesday 14 October, the show airs every Wednesday at 8pm ET as part of Rumble’s sports lineup, under what WWE calls a distribution and content partnership with the platform." },
      { type: "p", text: "Main Event had been on YouTube since the start of 2026. The move was first reported by Joe Otterson of Variety, before WWE confirmed it in a press release." },
      { type: "facts", title: "WWE Main Event on Rumble", items: [["First episode", "Wednesday 14 October 2026"], ["Time", "Wednesdays, 8pm ET"], ["Platform", "Rumble, in its sports lineup"], ["Before", "YouTube, since the start of 2026"], ["Deal", "A distribution and content partnership"]] },
      { type: "h2", text: "What Main Event is" },
      { type: "p", text: "Main Event features wrestlers from across WWE’s brands, Raw, SmackDown and NXT. Increasingly, it is where WWE tests how developmental talent from NXT holds up against the stars of its flagship shows, which makes it a useful watch for fans who want to spot the next names before they break through." },
      { type: "h2", text: "Why Rumble wants it" },
      { type: "p", text: "Rumble’s chief content officer, Claudio Ramolo, called Main Event a key pillar of the platform’s growing sports programming. For WWE, executive vice president Alex Varga pointed to the company’s focus on serving a digital-first audience." },
      { type: "quote", text: "Main Event becomes “a key pillar” of Rumble’s sports lineup." },
      { type: "h2", text: "About Rumble" },
      { type: "p", text: "Rumble was founded in 2013 as an alternative to YouTube. After 2020 it became popular with right-wing creators, including some who had been banned from other platforms, and it has ties to President Trump: it has hosted his Truth Social network. The move has drawn attention for that reason: coverage of the deal widely described it as WWE taking a show to a right-wing video platform." },
      { type: "h2", text: "How it happened" },
      { type: "list", items: ["Early 2026: Main Event starts airing on YouTube", "24 September 2026: Variety reports the move; WWE confirms it in a press release", "14 October 2026: the first episode on Rumble, Wednesday at 8pm ET"] },
      { type: "h2", text: "A Wednesday head-to-head" },
      { type: "p", text: "The new slot puts Main Event up against AEW Dynamite, which also airs on Wednesday nights at 8pm ET. Main Event is a lower-key show than Dynamite, but wrestling fans now have a choice to make each week." },
      { type: "checklist", title: "How to watch from 14 October", items: [
        "Find Main Event on Rumble, in its sports section, every Wednesday at 8pm ET.",
        "Outside North America? Convert the time: in the UK and Europe it is after midnight, in the early hours of Thursday.",
        "Watching AEW Dynamite too? The two shows now air at the same time, so plan which one to watch live.",
      ] },
      { type: "h2", text: "Questions and answers" },
      { type: "faq", items: [
        ["Where can I watch WWE Main Event now?", "From Wednesday 14 October 2026, on Rumble, every Wednesday at 8pm ET."],
        ["Was Main Event on YouTube?", "Yes, from the start of 2026 until the move to Rumble."],
        ["Who wrestles on Main Event?", "Wrestlers from Raw, SmackDown and NXT, often with NXT talent facing main-roster stars."],
        ["Does it clash with AEW?", "Yes. It airs at the same time as AEW Dynamite on Wednesday nights."],
        ["Who broke the news?", "Joe Otterson of Variety reported it first, before WWE confirmed it in a press release."],
      ] },
    ],
  },

  "streamer-awards-2026-applications": {
    ask: "Will you vote in the Streamer Awards?",
    body: [
      { type: "p", text: "The Streamer Awards are back, and for the first time streamers can put themselves forward. Applications for the 2026 awards close on Friday 2 October, the same day that nominations for other creators close. Voting runs from 16 to 31 October, and the show is on Thursday 12 November." },
      { type: "p", text: "QTCinderella, who created the awards and runs the show, announced the changes on Twitch’s blog. KATSEYE has been announced as a special performer." },
      { type: "facts", title: "The Streamer Awards 2026", items: [["Applications close", "Friday 2 October 2026"], ["Nominations", "12 September to 2 October"], ["Voting", "16 to 31 October"], ["Show", "Thursday 12 November: red carpet 2:30pm PT, show 5:30pm PT"], ["Results", "70% community vote, 30% industry panel"], ["Performer", "KATSEYE"]] },
      { type: "h2", text: "What’s new" },
      { type: "list", items: ["Creators can apply directly for the first time; before, the awards worked on nominations only.", "Applicants sign in with Twitch, pick their categories, upload clips and add a display name and photo.", "Nominees are told straight away and can update their profile any time before the broadcast.", "Agencies can apply on behalf of the creators they represent."] },
      { type: "h2", text: "Who is eligible" },
      { type: "p", text: "Content up to Thursday 1 October 2026 counts, including events that have been planned and announced for later. Each category goes to a public vote between four or five finalists, and the community’s votes make up 70% of the result, with an industry panel deciding the other 30%." },
      { type: "h2", text: "The categories" },
      { type: "list", items: ["Streamer of the Year, Gamer of the Year and Rising Star", "Best Just Chatting, IRL, Variety, VTuber and International Streamer", "Best Reality Streamer and Best Vertical Live Streamer", "Best Content Group, Stream Duo and Streamed Collab", "Best Marathon, Streamed Event and Streamed Series", "Stream Game of the Year, Best Breakout Streamer, League of Their Own and the Sapphire Award"] },
      { type: "h2", text: "Last year’s winners" },
      { type: "p", text: "At the 2025 awards, IShowSpeed was named Streamer of the Year for the second year running, Kai Cenat won four awards, CaseOh was Gamer of the Year and TheBurntPeanut was Best VTuber. You can see last year’s top five, with a video from each, on our home page." },
      { type: "quote", text: "Apply by 2 October, vote from 16 October, watch on 12 November." },
      { type: "checklist", title: "Applying? What to prepare", items: [
        "Choose your categories carefully; pick the ones your year really fits.",
        "Gather your best clips from up to 1 October 2026 before you start the form.",
        "Have a display name and a good photo ready.",
        "Submit before Friday 2 October, then keep your profile up to date.",
        "Remind your community to vote between 16 and 31 October: their votes count for 70%.",
      ] },
      { type: "h2", text: "Questions and answers" },
      { type: "faq", items: [
        ["When are the 2026 Streamer Awards?", "On Thursday 12 November 2026. The red carpet starts at 2:30pm PT and the show at 5:30pm PT."],
        ["How do I apply?", "Sign in with your Twitch account on the Streamer Awards site, choose categories and upload clips, before 2 October."],
        ["How are winners chosen?", "By a public vote between 16 and 31 October, worth 70%, and an industry panel, worth 30%."],
        ["Who won Streamer of the Year last time?", "IShowSpeed, for the second year in a row."],
      ] },
    ],
  },

  "made-on-youtube-2026": {
    body: [
      { type: "p", text: "YouTube used its yearly Made on YouTube event, on Wednesday 23 September, to announce more than 30 new features for creators. The biggest themes were AI help inside YouTube Studio, new ways to go live together, and fresh ways for smaller channels to earn." },
      { type: "p", text: "Some of it is available now. A lot of the live-streaming features arrive later this year or in early 2027." },
      { type: "facts", title: "Made on YouTube 2026", items: [["Date", "Wednesday 23 September 2026"], ["Announcements", "More than 30"], ["Live now", "Shorts series, Ask Studio on phones"], ["Later in 2026", "Watch With live reactions"], ["Early 2027", "Live Showdowns, live auto dubbing, matchmaking"]] },
      { type: "h2", text: "AI in YouTube Studio" },
      { type: "list", items: ["Ask Studio, YouTube’s AI assistant for creators, now on iOS and Android", "Draft feedback: AI notes on pacing, structure and storytelling before you publish", "A Research feed showing what is trending on the platform", "AI-suggested titles and thumbnails based on the video and the creator’s style", "Dynamic thumbnails: three options to test with different audiences", "Coming soon: A/B tests for up to three opening hooks", "Later this year: YouTube will swap out underperforming thumbnails automatically"] },
      { type: "p", text: "Creators have already run more than 40 million A/B tests on titles and thumbnails using YouTube’s existing tools, so testing openings and automatic thumbnail changes are a natural next step." },
      { type: "h2", text: "Going live" },
      { type: "list", items: ["Live Showdowns: two creators stream side by side and compete for the most chats, Super Chats and gifts. Testing starts in early 2027.", "Watch With: streamers can react live to eligible long videos and streams, while the original creator keeps the live ad revenue and fan funding and controls which videos can be used. Rolling out later in 2026.", "Live auto dubbing: real-time translation of what a streamer says, starting with English and Spanish for a small group of creators in early 2027.", "Matchmaking: browse live creators, or join a quick-match queue, to find someone to go live with. Early 2027."] },
      { type: "quote", text: "The original creator keeps the ad money when someone else reacts to their video." },
      { type: "h2", text: "Earning and discovery" },
      { type: "p", text: "Hype with Jewels lets fans of creators under 500,000 subscribers buy Jewels to give a video an extra push, and the creator earns Rubies, a new revenue stream. It is live in Brazil, South Korea, Japan and Taiwan. Shorts series, which group Shorts into shows with seasons and episodes and a button to watch them in order, are rolling out worldwide on web, mobile and TV." },
      { type: "checklist", title: "A creator? Try these first", items: [
        "Turn your recurring Shorts into a series so viewers can watch them in order.",
        "Use draft feedback on your next upload before you publish.",
        "Test thumbnails now; hook testing is on the way.",
        "Decide which of your videos you are happy for other streamers to react to when Watch With arrives.",
      ] },
      { type: "h2", text: "Questions and answers" },
      { type: "faq", items: [
        ["When was Made on YouTube 2026?", "On Wednesday 23 September 2026."],
        ["What are Live Showdowns?", "Split-screen live battles between two creators, scored by chats, Super Chats and gifts. Testing starts in early 2027."],
        ["Who gets paid when someone reacts to my video live?", "You do. With Watch With, the original creator keeps the live ad revenue and fan funding."],
        ["What is Hype with Jewels?", "A way for fans of channels under 500,000 subscribers to boost a video; creators earn Rubies in return. It is live in Brazil, South Korea, Japan and Taiwan."],
      ] },
    ],
  },
};
