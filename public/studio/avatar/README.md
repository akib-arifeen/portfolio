# The avatar slot

This folder contains the shipped `public/studio/avatar/akib.glb` and the full Rocketbox MIT notice.
No VRoid or VRM asset is used, and the earlier code-built person is not part of the site.

## Asset

- **Source:** Microsoft Rocketbox `Business_Male_03`, from the official
  https://github.com/microsoft/Microsoft-Rocketbox/tree/master/Assets/Avatars/Professions/Business_Male_03
  directory. The full notice is in `ROCKETBOX-LICENSE.md` and `CREDITS.md`.
- **Modifications:** short dark hair and clean-shaven source face retained; tie removed; navy blazer,
  charcoal shirt and dark trousers; thin rectangular gunmetal glasses; normalized finger/wrist/ankle
  chains; a 147 × 71 × 8 mm handset; new contact-correct seated clips.
- **Delivery:** 8,260 triangles including accessories, 80 joints, five embedded 1K WebP textures,
  and `laptop_idle` and `phone_idle` clips, each four seconds. The Meshopt-compressed GLB is about
  890 KB. Hair uses alpha clipping rather than blended transparency.
- **Orientation:** metres, glTF +Y up and +Z forward. The scene places the avatar at
  `[-0.45, 0, -2.85]` and rotates it `0.55` radians toward the laptop.

The source and reproducible asset-production scripts are outside the app in
`/Users/seechange/work-dir/akib/cv/avatar-rocketbox`. Only the optimized GLB belongs in `public`.

## Runtime

`AVATAR_SRC` is defined in `lib/studio/avatar.ts`. `lib/studio/glb.ts` dynamically imports
`GLTFLoader` and the Meshopt decoder already shipped with Three.js, checks the skin and both clips,
and loads after the room has painted. `AvatarPoseDriver` uses `AnimationMixer`, with a static first
frame for reduced motion. The handset is visible only for `phone_idle`. Missing or unreadable files
leave the empty stool in place. Disposal is deferred by one task so React StrictMode's development
setup/cleanup cycle cannot dispose an asset that is immediately remounted.

## Verification

    npm test -- tests/unit/avatar-glb.test.ts

The suite checks the loader boundary, real mixer transitions, reduced motion, handset visibility,
disposal, and the shipped GLB's skin, finger chains, clips, materials and extensions. Browser review
also exercises the actual GLB parse, laptop and phone layouts, reduced motion, failure fallback and
render metrics.

## Art notes

The Rocketbox face and hair retain their original game-texture detail. Strong studio lights can pick
out silver highlights in the hair, and the phone thumb is intentionally relaxed rather than tightly
curled. These are visual polish notes, not alternate assets or procedural replacements.
