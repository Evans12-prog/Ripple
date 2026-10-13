# RIPPLE — 3D Character Asset Provenance & License

## 1. Main Character: Mark (`Black_M_2_Casual.glb`)

* **Model File**: `public/assets/characters/Black_M_2_Casual.glb`
* **Character Role**: Mark — Young adult Ghanaian male university student at KNUST.
* **Base 3D Mesh & Skin**: Perceptually Validated African/Black Young Adult Male Avatar
  * **Source**: Google Research & University of Central Florida (UCF) Validated Avatar Library (VALID)
  * **Repository**: [`c-frame/valid-avatars-glb`](https://github.com/c-frame/valid-avatars-glb) / [`google/valid-avatar-library`](https://github.com/google/valid-avatar-library)
  * **Authors**: Tiffany Do, Ryan P. McMahan, et al.
  * **License**: **MIT License** (Open Source, Permissive commercial & non-commercial use)
  * **Visual Traits**: Dark-brown skin, short natural black hair, realistic young adult Ghanaian facial features and athletic proportions, navy blue casual university shirt, light trousers, dark sneakers with white soles.
  * **Mesh Specs**: 84 skeletal joints/bones, PBR materials, WebP texture compression (`EXT_meshopt_compression`).

* **Skeletal Animation System**:
  * Anatomical rest-pose relative rotation controller driving all 84 humanoid skeleton joints.
  * `Idle`: Natural diaphragmatic breathing rhythm, vertical hip cycle, subtle pelvic sway, and relaxed arm hanging posture.
  * `Walk`: Striding university walkway gait, counter-swinging arms with elbow flexion, knee flexion during swing phase, vertical hip bounce, and torso counter-twist.
  * `Run`: Athletic sprint locomotion with forward torso lean, increased cadence, deeper knee and hip angles, and increased elbow flexion.
  * `InAir / Jump`: Leg tucking and balance arm flare during airborne phase.

* **University Accessories**:
  * 3D University Backpack: Articulated dark backpack with dual shoulder straps, front zipper pouch, silver zip trims, and cyan water bottle attached to `Spine2` bone.

---

## 2. Background Campus Students (`Black_M_1_Casual.glb` & `Black_M_3_Casual.glb`)

All non-player student characters across the KNUST campus environment use genuine, realistic 3D human models from the same Google/UCF VALID library (MIT License), maintaining uniform visual quality and realism:

1. **Student 1 (Kwame)**:
   * **Model**: `Black_M_1_Casual.glb`
   * **Appearance**: Light blue buttoned casual university shirt, dark trousers, braided hair, charcoal backpack with water bottle.
   * **Location & Behavior**: Standing near lawn bench, engaged in active conversation with arm gesticulation.

2. **Student 2 (Kofi)**:
   * **Model**: `Black_M_3_Casual.glb`
   * **Appearance**: Grey polo shirt, jeans, short black hair.
   * **Location & Behavior**: Chatting with Student 1, listening attentively with conversational nodding.

3. **Student 3 (Yaw)**:
   * **Model**: `Black_M_2_Casual.glb`
   * **Appearance**: Casual student seated on wooden campus bench.
   * **Pose & Props**: Seated pose with 90° leg and knee bends, tilted head studying a 3D blue university notebook in lap.

4. **Student 4 (Akoto)**:
   * **Model**: `Black_M_1_Casual.glb`
   * **Appearance**: Light blue shirt, dark backpack with red bottle accent.
   * **Location & Behavior**: Patrolling along east-west crossway path with continuous realistic walking gait.

5. **Student 5 (Kweku)**:
   * **Model**: `Black_M_3_Casual.glb`
   * **Appearance**: Polo shirt and jeans, blue university backpack with green bottle.
   * **Location & Behavior**: Walking down main promenade towards academic building with continuous walking gait.

6. **Student 6 (Nana)**:
   * **Model**: `Black_M_1_Casual.glb`
   * **Appearance**: Casual university attire with amber accent backpack.
   * **Location & Behavior**: Waiting on the grand entrance stairs, observing campus courtyard.

---

## 3. Summary of Licensing

| Model Asset | Source | Author / Organization | License |
| :--- | :--- | :--- | :--- |
| `Black_M_1_Casual.glb` | VALID Library | Google Research & UCF | **MIT License** |
| `Black_M_2_Casual.glb` | VALID Library | Google Research & UCF | **MIT License** |
| `Black_M_3_Casual.glb` | VALID Library | Google Research & UCF | **MIT License** |
| Backpack & Notebook 3D Props | Ripple Procedural Assets | Ripple Development | **MIT License** |
