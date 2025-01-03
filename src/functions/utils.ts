interface Resource {
  images: {
    url: string
  }[]
}

export function spotifyImage(resource: Resource, resolution: 'high-res' | 'mid-res' | 'low-res' = 'high-res') {
  if (resource === undefined || resource.images === undefined || resource.images.length === 0) {
    return ''
  }
  if (resolution === 'low-res' && resource?.images[2]?.url !== undefined) {
    return resource.images[2].url
  }
  if ((resolution === 'mid-res' || resolution === 'low-res') && resource?.images[1]?.url !== undefined) {
    return resource.images[1].url
  }
  if (resource?.images[0]?.url !== undefined) {
    return resource.images[0].url
  }
  return ''
}