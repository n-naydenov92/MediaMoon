import type { CreativePreviewData } from '../../creativePreviewTypes'
import CardBody from '../CardBody/CardBody'
import CardFooter from '../CardFooter/CardFooter'
import CardHeader from '../CardHeader/CardHeader'
import CardMedia from '../CardMedia/CardMedia'

const FALLBACK_CTA = 'Learn more'

interface Props {
  readonly data: CreativePreviewData
}

export default function CardContent({ data }: Props): JSX.Element {
  return (
    <>
      <CardHeader pageName={data.pageName ?? data.adName} avatarUrl={data.pageAvatarUrl} />
      {data.body && <CardBody body={data.body} />}
      <CardMedia
        videoUrl={data.videoUrl}
        videoThumbnail={data.videoThumbnail}
        imageUrl={data.imageUrl}
        alt={data.adName}
      />
      <CardFooter
        headline={data.headline}
        description={data.description}
        callToAction={data.callToAction ?? FALLBACK_CTA}
        adName={data.adName}
      />
    </>
  )
}
