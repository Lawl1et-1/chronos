import * as THREE from 'three'

/**
 * World-space sun direction, shared by every lit material. The camera rig keeps
 * it offset from the view direction so the terminator always sits in frame.
 */
export const sunDir = new THREE.Vector3(1, 0.3, 0.6).normalize()
