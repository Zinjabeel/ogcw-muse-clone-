import { ArrowLeftIcon } from "@sanity/icons/ArrowLeft";
import { RemoveIcon } from "@sanity/icons/Remove";
import { Button, Card, Flex, Text, type CardTone } from "@sanity/ui";
import { Tooltip } from "@sanity/ui/tooltip";
import { getReleaseTone, usePerspective, type NavbarProps } from "sanity";
import { useStudioWindow } from "./studio-window";

// The studio's top bar with two buttons added: "Website" on the left goes back
// to the site's front page (and closes the studio), and the minimise button on
// the right tucks the studio into a bar at the bottom of the site, still open.

function WindowButton({ label, ...button }: { label: string } & Parameters<typeof Button>[0]) {
  return (
    <Tooltip content={<Text size={1}>{label}</Text>} placement="bottom" portal animate>
      <Button mode="bleed" aria-label={label} {...button} />
    </Tooltip>
  );
}

export function OgcwNavbar(props: NavbarProps) {
  const { minimise, leave } = useStudioWindow();
  // The same colour as the bar itself, which changes when you look at a release
  const tone = getReleaseTone(usePerspective().selectedPerspective) as CardTone;

  return (
    <Flex align="stretch" data-ui="OgcwNavbar">
      <Card tone={tone} borderBottom paddingLeft={3} paddingRight={1}>
        <Flex align="center" height="fill">
          <WindowButton label="Back to the website" icon={ArrowLeftIcon} text="Website" onClick={leave} />
        </Flex>
      </Card>
      <div style={{ flex: 1, minWidth: 0 }}>{props.renderDefault(props)}</div>
      <Card tone={tone} borderBottom paddingLeft={1} paddingRight={3}>
        <Flex align="center" height="fill">
          <WindowButton label="Minimise the studio" icon={RemoveIcon} onClick={minimise} />
        </Flex>
      </Card>
    </Flex>
  );
}
