# Last Known State -- Contexter Design Recovery

**Source:** c87f7091-3c30-4e53-acd8-b5dc768d90bc.jsonl (March 22, 2026)
**Last editor state:** JSONL line 4057 (Editor State #4)

---

## 1. Design System Artboards (file: new)

These 14 numbered artboards form the Contexter design system, created via I(document, ...) into the new document.

| # | ID | Name | Created in Call |
|---|---|---|---|
| 01 | BiAIX | 01 - Color System | #19 |
| 02 | U3ePH | 02 - Typography System | #26 |
| 03 | wEM5D | 03 - Spacing System | #30 |
| 04 | yWYpR | 04 - Logofolio | #34 |
| 05 | tYjKC | 05 - Component Library | #36 |
| 06 | EASNP | 06 - Elevation + Borders | #42 |
| 07 | FFRVH | 07 - Motion System | #43 |
| 08 | xHYLt | 08 - State Machine | #44 |
| 09 | XqCra | 09 - Grid System | #45 |
| 10 | lwr2Z | 10 - Data Table | #47 |
| 11 | aXSdL | 11 - Error States | #49 |
| 12 | ISNZN | 12 - Icon Set | #50 |
| 13 | 7J6ab | 13 - Directional Weights | #51 |
| 14 | vqAu7 | 14 - Type Specimen | #52 |

### Early prototypes (replaced by numbered artboards)

| ID | Name | Created in Call |
|---|---|---|
| (unknown) | Color System | #1 |
| (unknown) | Typography System | #5 |
| (unknown) | Logofolio | #8 |
| (unknown) | Component Library | #11 |

---

## 2. Reusable Components (11)

| ID | Name |
|---|---|
| JND89 | Button/Primary |
| wlUN3 | Button/Secondary |
| oqBCN | Button/Ghost |
| EYKbU | Button/Danger |
| JTQb6 | Input/Default |
| 9K6ma | Badge/Processing |
| JTHAo | Badge/Ready |
| WIOmX | Badge/Error |
| tbd8x | Badge/Pending |
| lRo74 | PipelineIndicator |
| YPAeU | DropZone |

---

## 3. Contexter UI Screen States (47 artboards)

**File:** nospace/design/contexter/contexter-ui.pen

### Template frames (originals used for cloning)

| ID | Base Screen | Times Cloned |
|---|---|---|
| Gafgu | Screen 1 - Hero (1.1 base) | 11 |
| wguyc | Screen 2 - Dashboard (5.1 base) | 9 |
| wsBdo | 2.3 - upload:processing | 6 |
| 3fCKc | 8.1 - api:overview | 4 |
| Lhf7n | 5.3 - dash:doc-selected | 2 |
| KFvfw | 10.1 - auth:register-prompt | 2 |
| 8j2r7 | 3.6 - upload:error | 1 |
| EV8fx | 7.1 - query:focused | 1 |
| a0Rbb | 6.2 - doc:chunks-tab | 1 |
| T4ZTm | 9.1 - settings:overview | 1 |

### All screen artboards (by section)


#### 1. Hero

| ID | Name | Type | Call # | Note |
|---|---|---|---|---|
| ? | Screen 1 - Hero | I(document) | #62 | early prototype, replaced |
| Gafgu | Screen 1 - Hero | I(document) | #63 | TEMPLATE -- base hero screen |
| 3w81x | 1.1 - hero:loading | I(document) | #88 |  |
| zUysf | 1.2 - hero:cta-hover | C(Gafgu) | #149 |  |
| VMX2y | 1.3 - hero:drop-focus | C(Gafgu) | #90 |  |
| rQIy9 | 1.6 - hero:scrolled | C(Gafgu) | #147 |  |

#### 2. Upload/Drop

| ID | Name | Type | Call # | Note |
|---|---|---|---|---|
| lQ8zz | 2.1 - hero:drag-over | C(Gafgu) | #92 |  |
| wsBdo | 2.3 - upload:processing | I(document) | #94 | TEMPLATE |
| cVJVl | 2.5 - upload:batch-processing | C(wsBdo) | #156 |  |
| w022e | 2.6 - drop:picker-open | C(Gafgu) | #197 |  |
| 6S039 | 2.12 - upload:youtube-processing | C(wsBdo) | #159 |  |
| KuzFN | 2.13 - upload:url-processing | C(wsBdo) | #161 |  |

#### 3. Upload Complete

| ID | Name | Type | Call # | Note |
|---|---|---|---|---|
| ptG17 | 3.5 - upload:complete | C(wsBdo) | #96 |  |
| 8j2r7 | 3.6 - upload:error | C(wsBdo) | #99 | also TEMPLATE |
| n3JlL | 3.7 - upload:retrying | C(8j2r7) | #162 |  |

#### 4. Error States

| ID | Name | Type | Call # | Note |
|---|---|---|---|---|
| Kmkwm | 4.1 - upload:format-error | C(Gafgu) | #101 |  |
| 6IA3K | 4.2 - upload:size-error | C(Gafgu) | #103 |  |
| sYx0y | 4.3 - drop:network-error | C(Gafgu) | #152 |  |
| Vnifb | 4.4 - upload:rate-limited | C(wsBdo) | #163 |  |
| 8FAY1 | 4.5 - drop:empty-error | C(Gafgu) | #154 |  |
| YEIYK | 4.6 - upload:duplicate-warning | C(Gafgu) | #104 |  |

#### 5. Dashboard

| ID | Name | Type | Call # | Note |
|---|---|---|---|---|
| obIR3 | Screen 2 - Upload | I(document) | #68 | early prototype |
| u49Cc | Screen 3 - Dashboard | I(document) | #73 | early prototype |
| wguyc | Screen 2 - Dashboard | I(document) | #83 | TEMPLATE -- base dashboard |
| 7hrpl | 5.2 - dash:row-hover | C(wguyc) | #165 |  |
| Lhf7n | 5.3 - dash:doc-selected | C(wguyc) | #109 | also TEMPLATE |
| Rbyyr | 5.5 - dash:empty | C(wguyc) | #106 |  |

#### 6. Document Detail

| ID | Name | Type | Call # | Note |
|---|---|---|---|---|
| a0Rbb | 6.2 - doc:chunks-tab | C(Lhf7n) | #180 | also TEMPLATE |
| aHPqN | 6.3 - doc:chunk-expanded | C(a0Rbb) | #182 |  |
| AvHBx | 6.4 - doc:delete-confirm | C(Lhf7n) | #168 |  |
| L7UTN | 6.5 - dash:doc-deleted | C(wguyc) | #166 |  |

#### 7. Query

| ID | Name | Type | Call # | Note |
|---|---|---|---|---|
| EV8fx | 7.1 - query:focused | C(wguyc) | #170 | also TEMPLATE |
| LjOwx | 7.2 - query:typing | C(EV8fx) | #172 |  |
| bXBws | 7.3 - query:loading | C(wguyc) | #112 |  |
| 6TnbV | 7.5 - query:source-expanded | C(wguyc) | #174 |  |
| F0vGT | 7.7 - query:error | C(wguyc) | #176 |  |
| LcVQM | 7.8 - query:no-results | C(wguyc) | #178 |  |

#### 8. API

| ID | Name | Type | Call # | Note |
|---|---|---|---|---|
| 3fCKc | 8.1 - api:overview | I(document) | #115 | TEMPLATE |
| cGeBp | 8.3 - api:copied | C(3fCKc) | #184 |  |
| VjBnm | 8.4 - api:token-created | C(3fCKc) | #186 |  |
| rT04t | 8.5 - api:share-created | C(3fCKc) | #188 |  |
| gCoKu | 8.6 - api:token-revoked | C(3fCKc) | #189 |  |

#### 9. Settings

| ID | Name | Type | Call # | Note |
|---|---|---|---|---|
| T4ZTm | 9.1 - settings:overview | I(document) | #119 | TEMPLATE |
| rZIta | 9.3 - settings:delete-all-confirm | C(T4ZTm) | #191 |  |

#### 10. Auth

| ID | Name | Type | Call # | Note |
|---|---|---|---|---|
| KFvfw | 10.1 - auth:register-prompt | C(Gafgu) | #121 | also TEMPLATE |
| VsPQL | 10.2 - auth:email-entered | C(KFvfw) | #193 |  |
| daRsO | 10.3 - auth:magic-link-sent | C(KFvfw) | #195 |  |

---

## 4. Design Tokens / Variables

Variables referenced via $--name syntax throughout the operations:

**accent:** $--accent

**bg:** $--bg-canvas, $--bg-elevated, $--bg-pressed, $--bg-surface

**black:** $--black

**border:** $--border-default, $--border-strong, $--border-subtle

**error:** $--error

**gray:** $--gray-05, $--gray-20, $--gray-50, $--gray-80

**interactive:** $--interactive-hover, $--interactive-pressed

**signal:** $--signal-error, $--signal-info, $--signal-success, $--signal-warning

**success:** $--success

**text:** $--text-disabled, $--text-primary, $--text-secondary, $--text-tertiary

**white:** $--white

---

## 5. Batch Get Results Summary

Total batch_get calls: 79

### batch_get #1 (line 2285)
**Parent:**  | **Patterns:** "[\"*\"]" | **searchDepth:**  | **readDepth:** 

```json
[]
```

### batch_get #2 (line 2287)
**Parent:**  | **Patterns:** "[\"top-level\"]" | **searchDepth:**  | **readDepth:** 

```json
[]
```

### batch_get #3 (line 4108)
**Parent:**  | **Patterns:** [] | **searchDepth:**  | **readDepth:** 2

```json
[{"children":[{"content":"09 · grid system","fill":"#0A0A0A","fontFamily":"JetBrains Mono","fontSize":32,"fontWeight":"700","id":"9n3c6","letterSpacing":-1,"name":"grT","type":"text"},{"content":"8px atom. 64px module. 12 columns. asymmetric. klee: 'specific ratios between unlike quantities.'","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":14,"fontWeight":"normal","id":"7nfkS","name":"grS","type":"text"},{"children":[{"alignItems":"center","children":"...","fill":"#1E3EA010","height":"fill_container","id":"hAll9","justifyContent":"center","layout":"vertical","name":"gc1","stroke":{"align":"inside","fill":"#1E3EA0","thickness":1},"type":"frame","width":"fill_container"},{"alignItems":"center","children":"...","fill":"#1E3EA010","height":"fill_container","id":"uFsk0","justifyContent":"center","layout":"vertical","name":"gc2","stroke":{"align":"inside","fill":"#1E3EA0","thickness":1},"type":"frame","width":"fill_container"},{"alignItems":"center","children":"...","fill":"#1E3EA010","height":"fill_container","id":"G2yv3","justifyContent":"center","layout":"vertical","name":"gc3","stroke":{"align":"inside","fill":"#1E3EA0","thickness":1},"type":"frame","width":"fill_container"},{"alignItems":"center","children":"...","fill":"#1E3EA010","height":"fill_container","id":"zqk16","justifyContent":"center","layout":"vertical","name":"gc4","stroke":{"align":"inside","fill":"#1E3EA0","thickness":1},"type":"frame","width":"fill_container"},{"alignItems":"center","children":"...","fill":"#1E3EA010","height":"fill_container","id":"zse6H","justifyContent":"center","layout":"vertical","name":"gc5","stroke":{"align":"inside","fill":"#1E3EA0","thickness":1},"type":"frame","width":"fill_container"},{"alignItems":"center","children":"...","fill":"#1E3EA010","height":"fill_container","id":"pXn9Q","justifyContent":"center","layout":"vertical","name":"gc6","stroke":{"align":"inside","fill":"#1E3EA0","thickness":1},"type":"frame","width":"fill_container"},{"alignItems":"center","ch
... [truncated, 8576 chars total]
```

### batch_get #4 (line 4112)
**Parent:**  | **Patterns:** [] | **searchDepth:**  | **readDepth:** 3

```json
[{"children":[{"alignItems":"center","children":[{"content":"1","fill":"#1E3EA0","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"l7nEb","name":"gc1t","type":"text"}],"fill":"#1E3EA010","height":"fill_container","id":"hAll9","justifyContent":"center","layout":"vertical","name":"gc1","stroke":{"align":"inside","fill":"#1E3EA0","thickness":1},"type":"frame","width":"fill_container"},{"alignItems":"center","children":[{"content":"2","fill":"#1E3EA0","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"ixGfo","name":"gc2t","type":"text"}],"fill":"#1E3EA010","height":"fill_container","id":"uFsk0","justifyContent":"center","layout":"vertical","name":"gc2","stroke":{"align":"inside","fill":"#1E3EA0","thickness":1},"type":"frame","width":"fill_container"},{"alignItems":"center","children":[{"content":"3","fill":"#1E3EA0","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"O0qV1","name":"gc3t","type":"text"}],"fill":"#1E3EA010","height":"fill_container","id":"G2yv3","justifyContent":"center","layout":"vertical","name":"gc3","stroke":{"align":"inside","fill":"#1E3EA0","thickness":1},"type":"frame","width":"fill_container"},{"alignItems":"center","children":[{"content":"4","fill":"#1E3EA0","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"h4KjD","name":"gc4t","type":"text"}],"fill":"#1E3EA010","height":"fill_container","id":"zqk16","justifyContent":"center","layout":"vertical","name":"gc4","stroke":{"align":"inside","fill":"#1E3EA0","thickness":1},"type":"frame","width":"fill_container"},{"alignItems":"center","children":[{"content":"5","fill":"#1E3EA0","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"fHPyM","name":"gc5t","type":"text"}],"fill":"#1E3EA010","height":"fill_container","id":"zse6H","justifyContent":"center","layout":"vertical","name":"gc5","stroke":{"align":"inside","fill":"#1E3EA0","thickness":1},"type":"frame","width":"fill_container"},{"alignItems":"center
... [truncated, 5590 chars total]
```

### batch_get #5 (line 4131)
**Parent:**  | **Patterns:** [] | **searchDepth:**  | **readDepth:** 3

```json
[{"children":[{"children":[{"fill":"#0A0A0A","height":48,"id":"A5aqI","name":"t1b","type":"frame","width":"fill_container"},{"content":"--text-primary  #0A0A0A","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"G9WUz","name":"t1n","type":"text"}],"gap":4,"id":"KngJc","layout":"vertical","name":"t1","type":"frame","width":"fill_container"},{"children":[{"fill":"#333333","height":48,"id":"6PFzj","name":"t2b","type":"frame","width":"fill_container"},{"content":"--text-secondary  #333333","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"cdHeF","name":"t2n","type":"text"}],"gap":4,"id":"3ROGW","layout":"vertical","name":"t2","type":"frame","width":"fill_container"},{"children":[{"fill":"#808080","height":48,"id":"rRxCx","name":"t3b","type":"frame","width":"fill_container"},{"content":"--text-tertiary  #808080","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"peAlZ","name":"t3n","type":"text"}],"gap":4,"id":"on25G","layout":"vertical","name":"t3","type":"frame","width":"fill_container"},{"children":[{"fill":"#CCCCCC","height":48,"id":"oJRjf","name":"t4b","type":"frame","width":"fill_container"},{"content":"--text-disabled  #CCCCCC","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"uXCZY","name":"t4n","type":"text"}],"gap":4,"id":"h1q56","layout":"vertical","name":"t4","type":"frame","width":"fill_container"}],"gap":16,"id":"xeVvj","name":"txtRow","type":"frame","width":"fill_container"},{"children":[{"children":[{"fill":"#FAFAFA","height":48,"id":"OCcjr","name":"b1b","stroke":{"align":"inside","fill":"#E5E5E5","thickness":1},"type":"frame","width":"fill_container"},{"content":"--bg-canvas  #FAFAFA  elevation.0","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"TmkZh","name":"b1n","type":"text"}],"gap":4,"id":"lkgnl","layout":"vertical","name":"b1","type":"frame","width":"fill_co
... [truncated, 9015 chars total]
```

### batch_get #6 (line 4143)
**Parent:**  | **Patterns:** [] | **searchDepth:**  | **readDepth:** 3

```json
[{"children":[{"content":"06 · elevation + borders","fill":"#0A0A0A","fontFamily":"JetBrains Mono","fontSize":32,"fontWeight":"700","id":"8Y7NH","letterSpacing":-1,"name":"evT","type":"text"},{"content":"no shadows. elevation through color shift only. van doesburg: pure plastic means.","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":14,"fontWeight":"normal","id":"Ew7ta","name":"evS","type":"text"},{"children":[{"children":[{"content":"elevation.0","fill":"#0A0A0A","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"500","id":"T6nzr","name":"ev0t","type":"text"},{"content":"--bg-canvas  #FAFAFA","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"CTVW3","name":"ev0v","type":"text"},{"content":"page ground","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"57RwQ","name":"ev0u","type":"text"}],"fill":"#FAFAFA","gap":4,"height":"fill_container","id":"6lq0M","layout":"vertical","name":"ev0","padding":16,"stroke":{"align":"inside","fill":"#E5E5E5","thickness":1},"type":"frame","width":"fill_container"},{"children":[{"content":"elevation.1","fill":"#0A0A0A","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"500","id":"1xEGW","name":"ev1t","type":"text"},{"content":"--bg-surface  #F2F2F2","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"q5w5V","name":"ev1v","type":"text"},{"content":"cards, panels, headers","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"cy0yF","name":"ev1u","type":"text"}],"fill":"#F2F2F2","gap":4,"height":"fill_container","id":"gDLfH","layout":"vertical","name":"ev1","padding":16,"type":"frame","width":"fill_container"},{"children":[{"content":"elevation.2","fill":"#0A0A0A","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"500","id":"DX2lg","name":"ev2t","type":"text"},{"content":"--bg-elevated  #E5E5E5","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontW
... [truncated, 3224 chars total]
```

### batch_get #7 (line 4146)
**Parent:**  | **Patterns:** [] | **searchDepth:**  | **readDepth:** 3

```json
[{"children":[{"content":"08 · state machine","fill":"#0A0A0A","fontFamily":"JetBrains Mono","fontSize":32,"fontWeight":"700","id":"yu2Mu","letterSpacing":-1,"name":"smT","type":"text"},{"content":"idle → hover → pressed → idle. every state discrete. schlemmer: each transformation complete.","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":14,"fontWeight":"normal","id":"WnJ7L","name":"smS","type":"text"},{"alignItems":"end","children":[{"alignItems":"center","children":[{"alignItems":"center","children":"...","fill":"#FAFAFA","gap":8,"id":"gW6Ut","justifyContent":"center","name":"st1b","padding":[8,16],"stroke":{"align":"inside","fill":"#CCCCCC","thickness":1},"type":"frame","width":"fill_container"},{"content":"idle\n--bg-canvas\n--border-default","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"2qWss","lineHeight":1.4,"name":"st1l","textAlign":"center","type":"text"}],"gap":8,"id":"GwGSp","layout":"vertical","name":"st1","type":"frame","width":"fill_container"},{"alignItems":"center","children":[{"alignItems":"center","children":"...","fill":"#F2F2F2","gap":8,"id":"0g8qh","justifyContent":"center","name":"st2b","padding":[8,16],"stroke":{"align":"inside","fill":"#CCCCCC","thickness":1},"type":"frame","width":"fill_container"},{"content":"hover\n--interactive-hover\n80ms","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"0ouqX","lineHeight":1.4,"name":"st2l","textAlign":"center","type":"text"}],"gap":8,"id":"XxgPF","layout":"vertical","name":"st2","type":"frame","width":"fill_container"},{"alignItems":"center","children":[{"alignItems":"center","children":"...","fill":"#D9D9D9","gap":8,"id":"9lDG4","justifyContent":"center","name":"st3b","padding":[8,16],"stroke":{"align":"inside","fill":"#808080","thickness":1},"type":"frame","width":"fill_container"},{"content":"pressed\n--interactive-pressed\n0ms","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"norm
... [truncated, 6893 chars total]
```

### batch_get #8 (line 4213)
**Parent:**  | **Patterns:** [] | **searchDepth:**  | **readDepth:** 3

```json
[{"alignItems":"center","children":[{"content":"upload file","fill":"$--white","fontFamily":"JetBrains Mono","fontSize":14,"fontWeight":"500","id":"6GutY","name":"bpt","type":"text"}],"fill":"$--accent","gap":8,"id":"JND89","name":"Button/Primary","padding":[8,16],"reusable":true,"type":"frame"}]
```

### batch_get #9 (line 4221)
**Parent:**  | **Patterns:** [] | **searchDepth:**  | **readDepth:** 3

```json
[{"alignItems":"center","children":[{"fill":"$--text-tertiary","height":6,"id":"IaDUJ","name":"ba4d","type":"ellipse","width":6},{"content":"pending","fill":"$--text-tertiary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"mfidM","name":"ba4t","type":"text"}],"gap":6,"id":"tbd8x","name":"Badge/Pending","padding":[4,10],"reusable":true,"stroke":{"align":"inside","fill":"$--border-default","thickness":1},"type":"frame"}]
```

### batch_get #10 (line 4239)
**Parent:**  | **Patterns:** [] | **searchDepth:**  | **readDepth:** 2

```json
[{"alignItems":"center","children":[{"fill":"$--signal-success","height":6,"id":"Nb4WC","name":"ba2d","type":"ellipse","width":6},{"content":"ready","fill":"$--signal-success","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"1TKgA","name":"ba2t","type":"text"}],"gap":6,"id":"JTHAo","name":"Badge/Ready","padding":[4,10],"reusable":true,"stroke":{"align":"inside","fill":"$--signal-success","thickness":1},"type":"frame"},{"alignItems":"center","children":[{"fill":"$--accent","height":6,"id":"ec4XS","name":"ba1d","type":"ellipse","width":6},{"content":"processing","fill":"$--accent","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"FoLz7","name":"ba1t","type":"text"}],"gap":6,"id":"9K6ma","name":"Badge/Processing","padding":[4,10],"reusable":true,"stroke":{"align":"inside","fill":"$--accent","thickness":1},"type":"frame"}]
```

### batch_get #11 (line 4259)
**Parent:**  | **Patterns:** [] | **searchDepth:**  | **readDepth:** 2

```json
[{"alignItems":"center","children":[{"content":"enter query...","fill":"$--text-disabled","fontFamily":"JetBrains Mono","fontSize":14,"fontWeight":"normal","id":"Kquvv","name":"i1t","type":"text"}],"height":40,"id":"JTQb6","name":"Input/Default","padding":[0,16],"reusable":true,"stroke":{"align":"inside","fill":"$--border-default","thickness":1},"type":"frame","width":320}]
```

### batch_get #12 (line 4537)
**Parent:**  | **Patterns:** [] | **searchDepth:**  | **readDepth:** 2

```json
[{"children":[{"alignItems":"center","children":[{"fill":"$--text-secondary","height":20,"iconFontFamily":"lucide","iconFontName":"file-text","id":"y75SN","name":"fileIcon","type":"icon_font","width":20},{"children":"...","gap":4,"id":"1vsCk","layout":"vertical","name":"fileInfo","type":"frame","width":"fill_container"},{"id":"FdmZy","name":"fileBadge","ref":"9K6ma","type":"ref","x":1200,"y":23}],"fill":"$--bg-surface","gap":16,"id":"DLOjA","name":"File Processing","padding":[16,20],"stroke":{"align":"inside","fill":"$--border-subtle","thickness":1},"type":"frame","width":"fill_container"},{"alignItems":"center","children":[{"alignItems":"center","children":"...","gap":6,"id":"H5ZaB","name":"stg1","type":"frame","width":"fill_container"},{"fill":"$--border-subtle","height":1,"id":"5EcGE","name":"sep1","type":"frame","width":32},{"alignItems":"center","children":"...","gap":6,"id":"HXzKu","name":"stg2","type":"frame","width":"fill_container"},{"fill":"$--border-subtle","height":1,"id":"zOYDu","name":"sep2","type":"frame","width":32},{"alignItems":"center","children":"...","gap":6,"id":"gQfl5","name":"stg3","type":"frame","width":"fill_container"},{"fill":"$--border-subtle","height":1,"id":"lmmE5","name":"sep3","type":"frame","width":32},{"alignItems":"center","children":"...","gap":6,"id":"zt7Ix","name":"stg4","type":"frame","width":"fill_container"}],"id":"CQuTa","name":"Pipeline Progress","type":"frame","width":"fill_container"},{"children":[{"content":"ПРЕВЬЮ ИЗВЛЕЧЁННОГО ТЕКСТА","fill":"$--text-tertiary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"didlY","letterSpacing":1,"name":"pvLabel","type":"text"},{"content":"the system architecture follows a modular pipeline design.\neach stage operates independently: parse → chunk → embed → index.\nthis ensures fault isolation and allows individual stage optimization...","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"normal","id":"gKbh8","lineHeight":1.5,"name":
... [truncated, 2445 chars total]
```

### batch_get #13 (line 4539)
**Parent:**  | **Patterns:** [] | **searchDepth:**  | **readDepth:** 2

```json
[{"alignItems":"center","children":[{"fill":"$--black","height":8,"id":"qzFya","name":"stg1d","type":"ellipse","width":8},{"content":"parse ✓","fill":"$--black","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"WBgqq","name":"stg1t","type":"text"}],"gap":6,"id":"H5ZaB","name":"stg1","type":"frame","width":"fill_container"},{"alignItems":"center","children":[{"fill":"$--accent","height":8,"id":"qioxf","name":"stg2d","type":"ellipse","width":8},{"content":"chunk","fill":"$--accent","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"700","id":"BAKR8","name":"stg2t","type":"text"}],"gap":6,"id":"HXzKu","name":"stg2","type":"frame","width":"fill_container"},{"alignItems":"center","children":[{"fill":"$--text-tertiary","height":8,"id":"rGhn7","name":"stg3d","type":"ellipse","width":8},{"content":"embed","fill":"$--text-tertiary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"ErooV","name":"stg3t","type":"text"}],"gap":6,"id":"gQfl5","name":"stg3","type":"frame","width":"fill_container"},{"alignItems":"center","children":[{"fill":"$--text-tertiary","height":8,"id":"RCZNf","name":"stg4d","type":"ellipse","width":8},{"content":"index","fill":"$--text-tertiary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"YGl4M","name":"stg4t","type":"text"}],"gap":6,"id":"zt7Ix","name":"stg4","type":"frame","width":"fill_container"}]
```

### batch_get #14 (line 4549)
**Parent:**  | **Patterns:** [] | **searchDepth:**  | **readDepth:** 2

```json
[{"children":[{"alignItems":"center","children":[{"fill":"$--text-secondary","height":20,"iconFontFamily":"lucide","iconFontName":"file-text","id":"G7BXN","name":"fileIcon","type":"icon_font","width":20},{"children":"...","gap":4,"id":"DSMlw","layout":"vertical","name":"fileInfo","type":"frame","width":"fill_container"},{"id":"wyxxd","name":"fileBadge","ref":"9K6ma","type":"ref","x":1200,"y":23}],"fill":"$--bg-surface","gap":16,"id":"JncPe","name":"File Processing","padding":[16,20],"stroke":{"align":"inside","fill":"$--border-subtle","thickness":1},"type":"frame","width":"fill_container"},{"alignItems":"center","children":[{"alignItems":"center","children":"...","gap":6,"id":"PqeYk","name":"stg1","type":"frame","width":"fill_container"},{"fill":"$--border-subtle","height":1,"id":"0peO2","name":"sep1","type":"frame","width":32},{"alignItems":"center","children":"...","gap":6,"id":"y83Rj","name":"stg2","type":"frame","width":"fill_container"},{"fill":"$--border-subtle","height":1,"id":"Zmc1g","name":"sep2","type":"frame","width":32},{"alignItems":"center","children":"...","gap":6,"id":"IjPTR","name":"stg3","type":"frame","width":"fill_container"},{"fill":"$--border-subtle","height":1,"id":"JHTmB","name":"sep3","type":"frame","width":32},{"alignItems":"center","children":"...","gap":6,"id":"SQCNF","name":"stg4","type":"frame","width":"fill_container"}],"id":"HpyCI","name":"Pipeline Progress","type":"frame","width":"fill_container"},{"children":[{"content":"ПРЕВЬЮ ИЗВЛЕЧЁННОГО ТЕКСТА","fill":"$--text-tertiary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"DKQUT","letterSpacing":1,"name":"pvLabel","type":"text"},{"content":"the system architecture follows a modular pipeline design.\neach stage operates independently: parse → chunk → embed → index.\nthis ensures fault isolation and allows individual stage optimization...","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"normal","id":"QHcwf","lineHeight":1.5,"name":
... [truncated, 2445 chars total]
```

### batch_get #15 (line 4551)
**Parent:**  | **Patterns:** [] | **searchDepth:**  | **readDepth:** 2

```json
[{"alignItems":"center","children":[{"fill":"$--black","height":8,"id":"BRkJx","name":"stg1d","type":"ellipse","width":8},{"content":"parse ✓","fill":"$--black","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"KiDOS","name":"stg1t","type":"text"}],"gap":6,"id":"PqeYk","name":"stg1","type":"frame","width":"fill_container"},{"alignItems":"center","children":[{"fill":"$--accent","height":8,"id":"qIjlW","name":"stg2d","type":"ellipse","width":8},{"content":"chunk","fill":"$--accent","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"700","id":"1iHWN","name":"stg2t","type":"text"}],"gap":6,"id":"y83Rj","name":"stg2","type":"frame","width":"fill_container"},{"alignItems":"center","children":[{"fill":"$--text-tertiary","height":8,"id":"5didf","name":"stg3d","type":"ellipse","width":8},{"content":"embed","fill":"$--text-tertiary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"sETEC","name":"stg3t","type":"text"}],"gap":6,"id":"IjPTR","name":"stg3","type":"frame","width":"fill_container"},{"alignItems":"center","children":[{"fill":"$--text-tertiary","height":8,"id":"wJg1e","name":"stg4d","type":"ellipse","width":8},{"content":"index","fill":"$--text-tertiary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"DzQuD","name":"stg4t","type":"text"}],"gap":6,"id":"SQCNF","name":"stg4","type":"frame","width":"fill_container"}]
```

### batch_get #16 (line 4595)
**Parent:**  | **Patterns:** [] | **searchDepth:**  | **readDepth:** 1

```json
[{"children":[{"children":"...","gap":16,"id":"8NqvD","name":"Stats","type":"frame","width":"fill_container"},{"children":"...","id":"dZ0pG","layout":"vertical","name":"Documents Table","type":"frame","width":"fill_container"}],"gap":24,"height":"fill_container","id":"pz5hL","layout":"vertical","name":"Left · Documents","type":"frame","width":"fill_container"}]
```

### batch_get #17 (line 4597)
**Parent:**  | **Patterns:** [] | **searchDepth:**  | **readDepth:** 1

```json
[{"children":[{"children":"...","fill":"$--bg-surface","gap":4,"id":"Vu87D","layout":"vertical","name":"s1","padding":[16,20],"type":"frame","width":"fill_container"},{"children":"...","fill":"$--bg-surface","gap":4,"id":"WhmqS","layout":"vertical","name":"s2","padding":[16,20],"type":"frame","width":"fill_container"},{"children":"...","fill":"$--bg-surface","gap":4,"id":"6uSXr","layout":"vertical","name":"s3","padding":[16,20],"type":"frame","width":"fill_container"},{"children":"...","fill":"$--bg-surface","gap":4,"id":"zeYhm","layout":"vertical","name":"s4","padding":[16,20],"type":"frame","width":"fill_container"}],"gap":16,"id":"8NqvD","name":"Stats","type":"frame","width":"fill_container"},{"children":[{"children":"...","fill":"$--bg-surface","id":"orlXR","name":"dh","padding":[10,16],"type":"frame","width":"fill_container"},{"alignItems":"center","children":"...","id":"5evdb","name":"dr1","padding":[10,16],"stroke":{"align":"inside","fill":"$--border-subtle","thickness":{"bottom":1}},"type":"frame","width":"fill_container"},{"alignItems":"center","children":"...","id":"MZpI6","name":"dr2","padding":[10,16],"stroke":{"align":"inside","fill":"$--border-subtle","thickness":{"bottom":1}},"type":"frame","width":"fill_container"},{"alignItems":"center","children":"...","id":"jOAPs","name":"dr3","padding":[10,16],"stroke":{"align":"inside","fill":"$--border-subtle","thickness":{"bottom":1}},"type":"frame","width":"fill_container"},{"alignItems":"center","children":"...","id":"PdDZB","name":"dr4","padding":[10,16],"stroke":{"align":"inside","fill":"$--border-subtle","thickness":{"bottom":1}},"type":"frame","width":"fill_container"},{"alignItems":"center","children":"...","id":"6hBzV","name":"dr5","padding":[10,16],"type":"frame","width":"fill_container"}],"id":"dZ0pG","layout":"vertical","name":"Documents Table","type":"frame","width":"fill_container"},{"children":[{"content":"ЗАПРОС","fill":"$--text-tertiary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":
... [truncated, 4026 chars total]
```

### batch_get #18 (line 4600)
**Parent:**  | **Patterns:** [] | **searchDepth:**  | **readDepth:** 2

```json
[{"children":[{"content":"5","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":32,"fontWeight":"700","id":"BJHyZ","name":"s1v","type":"text"},{"content":"документов","fill":"$--text-tertiary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"8bMMn","name":"s1l","type":"text"}],"fill":"$--bg-surface","gap":4,"id":"Vu87D","layout":"vertical","name":"s1","padding":[16,20],"type":"frame","width":"fill_container"},{"children":[{"content":"47","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":32,"fontWeight":"700","id":"HauDZ","name":"s2v","type":"text"},{"content":"чанков","fill":"$--text-tertiary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"7tMEw","name":"s2l","type":"text"}],"fill":"$--bg-surface","gap":4,"id":"WhmqS","layout":"vertical","name":"s2","padding":[16,20],"type":"frame","width":"fill_container"},{"children":[{"content":"47","fill":"$--accent","fontFamily":"JetBrains Mono","fontSize":32,"fontWeight":"700","id":"Tt520","name":"s3v","type":"text"},{"content":"векторов","fill":"$--text-tertiary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"qptIX","name":"s3l","type":"text"}],"fill":"$--bg-surface","gap":4,"id":"6uSXr","layout":"vertical","name":"s3","padding":[16,20],"type":"frame","width":"fill_container"},{"children":[{"content":"12","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":32,"fontWeight":"700","id":"tVhwt","name":"s4v","type":"text"},{"content":"запросов","fill":"$--text-tertiary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"ZLzvW","name":"s4l","type":"text"}],"fill":"$--bg-surface","gap":4,"id":"zeYhm","layout":"vertical","name":"s4","padding":[16,20],"type":"frame","width":"fill_container"}]
```

### batch_get #19 (line 4609)
**Parent:**  | **Patterns:** [] | **searchDepth:**  | **readDepth:** 1

```json
[{"children":[{"children":"...","gap":16,"id":"PSMZO","name":"Stats","type":"frame","width":"fill_container"},{"children":"...","id":"Yd17x","layout":"vertical","name":"Documents Table","type":"frame","width":"fill_container"}],"gap":24,"height":"fill_container","id":"jNMRZ","layout":"vertical","name":"Left · Documents","type":"frame","width":"fill_container"}]
```

### batch_get #20 (line 4611)
**Parent:**  | **Patterns:** [] | **searchDepth:**  | **readDepth:** 1

```json
[{"children":[{"children":"...","fill":"$--bg-surface","id":"K4tnm","name":"dh","padding":[10,16],"type":"frame","width":"fill_container"},{"alignItems":"center","children":"...","id":"lQdOf","name":"dr1","padding":[10,16],"stroke":{"align":"inside","fill":"$--border-subtle","thickness":{"bottom":1}},"type":"frame","width":"fill_container"},{"alignItems":"center","children":"...","id":"ncots","name":"dr2","padding":[10,16],"stroke":{"align":"inside","fill":"$--border-subtle","thickness":{"bottom":1}},"type":"frame","width":"fill_container"},{"alignItems":"center","children":"...","id":"kR6wN","name":"dr3","padding":[10,16],"stroke":{"align":"inside","fill":"$--border-subtle","thickness":{"bottom":1}},"type":"frame","width":"fill_container"},{"alignItems":"center","children":"...","id":"ICQME","name":"dr4","padding":[10,16],"stroke":{"align":"inside","fill":"$--border-subtle","thickness":{"bottom":1}},"type":"frame","width":"fill_container"},{"alignItems":"center","children":"...","id":"aZKkU","name":"dr5","padding":[10,16],"type":"frame","width":"fill_container"}],"id":"Yd17x","layout":"vertical","name":"Documents Table","type":"frame","width":"fill_container"}]
```

### batch_get #21 (line 4621)
**Parent:**  | **Patterns:** [] | **searchDepth:**  | **readDepth:** 1

```json
[{"children":[{"content":"ЗАПРОС","fill":"$--text-tertiary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"l2XoG","letterSpacing":1,"name":"qLabel","type":"text"},{"descendants":{"Kquvv":{"content":"как устроен пайплайн?"}},"id":"oX6pQ","name":"qInput","ref":"JTQb6","type":"ref","width":"fill_container","x":32,"y":69},{"content":"ОТВЕТ","fill":"$--text-tertiary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"NJMtm","letterSpacing":1,"name":"ansLabel","type":"text"},{"content":"архитектура системы построена на модульном\nпайплайне. каждый этап работает независимо:\nпарсинг → чанкирование → эмбеддинги → индекс.\nразделение обеспечивает изоляцию ошибок и\nпозволяет оптимизировать каждый этап отдельно.","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"normal","id":"k20Dn","lineHeight":1.5,"name":"ansText","textGrowth":"fixed-width","type":"text","width":"fill_container"},{"content":"ИСТОЧНИКИ","fill":"$--text-tertiary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"xIPJj","letterSpacing":1,"name":"srcLabel","type":"text"},{"alignItems":"center","children":"...","fill":"$--bg-surface","gap":8,"id":"lR5Tn","name":"src1","padding":[8,12],"type":"frame","width":"fill_container"},{"alignItems":"center","children":"...","fill":"$--bg-surface","gap":8,"id":"SdQ75","name":"src2","padding":[8,12],"type":"frame","width":"fill_container"},{"content":"API","fill":"$--text-tertiary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"NimCf","letterSpacing":1,"name":"apiLabel","type":"text"},{"children":"...","fill":"$--black","gap":4,"id":"9e2J0","layout":"vertical","name":"apiBlock","padding":16,"type":"frame","width":"fill_container"},{"alignItems":"center","children":"...","fill":"$--bg-surface","gap":8,"id":"cJ7rC","name":"mcpRow","padding":[8,12],"type":"frame","width":"fill_container"}],"gap":24,"height":"fill_container","id":"n8TCj","layout":"vertical","name":"
... [truncated, 2143 chars total]
```

### batch_get #22 (line 4683)
**Parent:** Gafgu | **Patterns:** [{"type": "text"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[{"content":"contexter","fill":"$--black","fontFamily":"JetBrains Mono","fontSize":20,"fontWeight":"500","id":"4fNFT","letterSpacing":-1,"name":"logo","type":"text"},{"content":"docs","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":14,"fontWeight":"normal","id":"x53y5","name":"navLink1","type":"text"},{"content":"pricing","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":14,"fontWeight":"normal","id":"R8QG0","name":"navLink2","type":"text"},{"content":"перетащите файлы или вставьте текст","fill":"$--text-tertiary","fontFamily":"JetBrains Mono","fontSize":14,"fontWeight":"normal","id":"Svztr","name":"dropText","textAlign":"center","type":"text"},{"content":"pdf · docx · xlsx · аудио · youtube · изображения · или просто текст","fill":"$--text-disabled","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"normal","id":"cGPKu","name":"dropHint","textAlign":"center","type":"text"},{"content":"ctrl + v","fill":"$--white","fontFamily":"JetBrains Mono","fontSize":11,"fontWeight":"500","id":"9PIGI","name":"pasteKeyText","type":"text"},{"content":"скопировали текст? просто вставьте — мы всё сделаем","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":11,"fontWeight":"normal","id":"S84N3","name":"pasteDesc","type":"text"},{"content":"rag-as-a-service","fill":"$--accent","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"500","id":"eYlDt","name":"counter","type":"text"},{"content":"загружайте файлы —\nподключайте свой ии чат","fill":"$--black","fontFamily":"JetBrains Mono","fontSize":48,"fontWeight":"700","id":"TNFZY","letterSpacing":-2,"lineHeight":1.05,"name":"bigTitle","textGrowth":"fixed-width","type":"text","width":"fill_container"},{"content":"как это работает","fill":"$--black","fontFamily":"JetBrains Mono","fontSize":14,"fontWeight":"700","id":"mCo1S","name":"detailsTitle","type":"text"},{"content":"вы загружаете файл в любом формате — мы разбираем его, индексируем содержимое и создаём базу знаний. задава
... [truncated, 2325 chars total]
```

### batch_get #23 (line 4816)
**Parent:** YEIYK | **Patterns:** [{"name": "dupNo|cancel|Ghost"}] | **searchDepth:** 5 | **readDepth:** 2

```json
[{"id":"rcsht","name":"dupNo","ref":"oqBCN","type":"ref","x":120}]
```

### batch_get #24 (line 4818)
**Parent:**  | **Patterns:** [] | **searchDepth:**  | **readDepth:** 2

```json
[{"alignItems":"center","children":[{"content":"cancel","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":14,"fontWeight":"500","id":"mP1bu","name":"bgt","type":"text"}],"gap":8,"id":"oqBCN","name":"Button/Ghost","padding":[8,16],"reusable":true,"type":"frame"}]
```

### batch_get #25 (line 4823)
**Parent:** ptG17 | **Patterns:** [{"name": "fileBadge"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[{"id":"FdmZy","name":"fileBadge","ref":"9K6ma","type":"ref","x":1200,"y":23}]
```

### batch_get #26 (line 4828)
**Parent:** 8j2r7 | **Patterns:** [{"name": "fileBadge"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[{"id":"wyxxd","name":"fileBadge","ref":"9K6ma","type":"ref","x":1200,"y":23}]
```

### batch_get #27 (line 4845)
**Parent:** wguyc | **Patterns:** [{"name": "s2l|s3l"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[{"content":"чанков","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"CYtyx","name":"s2l","type":"text"},{"content":"векторов","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"N4WA6","name":"s3l","type":"text"}]
```

### batch_get #28 (line 4847)
**Parent:** Rbyyr | **Patterns:** [{"name": "s2l|s3l"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[{"content":"чанков","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"7tMEw","name":"s2l","type":"text"},{"content":"векторов","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"qptIX","name":"s3l","type":"text"}]
```

### batch_get #29 (line 4849)
**Parent:** Lhf7n | **Patterns:** [{"name": "s2l|s3l"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[{"content":"чанков","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"yVNEr","name":"s2l","type":"text"},{"content":"векторов","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"IT6Q4","name":"s3l","type":"text"},{"content":"токенов","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"0oGwd","name":"ds2l","type":"text"},{"content":"pipeline","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"l3rHm","name":"ds3l","type":"text"}]
```

### batch_get #30 (line 4851)
**Parent:** bXBws | **Patterns:** [{"name": "s2l|s3l"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[{"content":"чанков","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"qtPkE","name":"s2l","type":"text"},{"content":"векторов","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"rkY1J","name":"s3l","type":"text"}]
```

### batch_get #31 (line 4859)
**Parent:** wguyc | **Patterns:** [{"name": "qInput"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[{"descendants":{"Kquvv":{"content":"как устроен пайплайн?"}},"id":"CMFWW","name":"qInput","ref":"JTQb6","type":"ref","width":"fill_container","x":32,"y":69}]
```

### batch_get #32 (line 4921)
**Parent:** wguyc | **Patterns:** [{"name": "apiLabel|apiBlock|mcpRow"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[{"content":"API","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"lAEyi","letterSpacing":1,"name":"apiLabel","type":"text"},{"children":"...","fill":"$--black","gap":4,"id":"b6DSa","layout":"vertical","name":"apiBlock","padding":16,"type":"frame","width":"fill_container"},{"alignItems":"center","children":"...","fill":"$--bg-surface","gap":8,"id":"Z8rKI","name":"mcpRow","padding":[8,12],"type":"frame","width":"fill_container"}]
```

### batch_get #33 (line 4926)
**Parent:**  | **Patterns:** [] | **searchDepth:**  | **readDepth:** 1

```json
[{"children":[{"alignItems":"center","children":"...","height":56,"id":"ECi5i","justifyContent":"space_between","name":"apiNav","padding":[0,64],"stroke":{"align":"inside","fill":"$--border-subtle","thickness":{"bottom":1}},"type":"frame","width":"fill_container"},{"children":"...","gap":64,"height":"fill_container","id":"jw9ha","name":"API Body","padding":[32,64],"type":"frame","width":"fill_container"}],"fill":"$--white","height":900,"id":"3fCKc","layout":"vertical","name":"8.1 · api:overview","type":"frame","width":1440,"x":0,"y":87970}]
```

### batch_get #34 (line 4960)
**Parent:** VMX2y | **Patterns:** [{"name": "bigTitle|counter|detailsTitle|desc"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[{"content":"скопировали текст? просто вставьте — мы всё сделаем","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"Rr9da","name":"pasteDesc","type":"text"},{"content":"rag-as-a-service","fill":"$--accent","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"500","id":"BaM5r","name":"counter","type":"text"},{"content":"загружайте файлы —\nподключайте свой ии чат","fill":"$--black","fontFamily":"JetBrains Mono","fontSize":48,"fontWeight":"700","id":"Od4bI","letterSpacing":-2,"lineHeight":1.05,"name":"bigTitle","textGrowth":"fixed-width","type":"text","width":"fill_container"},{"content":"как это работает","fill":"$--black","fontFamily":"JetBrains Mono","fontSize":14,"fontWeight":"700","id":"FA1nU","name":"detailsTitle","type":"text"},{"content":"вы загружаете файл в любом формате — мы разбираем его, индексируем содержимое и создаём базу знаний. задавайте вопросы через api или подключите к claude, chatgpt или cursor. никакой настройки — загрузили файл, получили ответы.","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"normal","id":"ST2O2","lineHeight":1.5,"name":"desc","textGrowth":"fixed-width","type":"text","width":"fill_container"}]
```

### batch_get #35 (line 4962)
**Parent:** lQ8zz | **Patterns:** [{"name": "bigTitle|counter|detailsTitle|desc|dt1v|dt2v|dt3v"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[{"content":"скопировали текст? просто вставьте — мы всё сделаем","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"KVmwa","name":"pasteDesc","type":"text"},{"content":"rag-as-a-service","fill":"$--accent","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"500","id":"qbJb2","name":"counter","type":"text"},{"content":"загружайте файлы —\nподключайте свой ии чат","fill":"$--black","fontFamily":"JetBrains Mono","fontSize":48,"fontWeight":"700","id":"FRrHD","letterSpacing":-2,"lineHeight":1.05,"name":"bigTitle","textGrowth":"fixed-width","type":"text","width":"fill_container"},{"content":"как это работает","fill":"$--black","fontFamily":"JetBrains Mono","fontSize":14,"fontWeight":"700","id":"aNmUj","name":"detailsTitle","type":"text"},{"content":"вы загружаете файл в любом формате — мы разбираем его, индексируем содержимое и создаём базу знаний. задавайте вопросы через api или подключите к claude, chatgpt или cursor. никакой настройки — загрузили файл, получили ответы.","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"normal","id":"pvptG","lineHeight":1.5,"name":"desc","textGrowth":"fixed-width","type":"text","width":"fill_container"}]
```

### batch_get #36 (line 4964)
**Parent:** Kmkwm | **Patterns:** [{"name": "bigTitle|counter|detailsTitle|desc"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[{"content":"скопировали текст? просто вставьте — мы всё сделаем","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"ob7ZK","name":"pasteDesc","type":"text"},{"content":"rag-as-a-service","fill":"$--accent","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"500","id":"jjmGv","name":"counter","type":"text"},{"content":"загружайте файлы —\nподключайте свой ии чат","fill":"$--black","fontFamily":"JetBrains Mono","fontSize":48,"fontWeight":"700","id":"d49SL","letterSpacing":-2,"lineHeight":1.05,"name":"bigTitle","textGrowth":"fixed-width","type":"text","width":"fill_container"},{"content":"как это работает","fill":"$--black","fontFamily":"JetBrains Mono","fontSize":14,"fontWeight":"700","id":"3mIj0","name":"detailsTitle","type":"text"},{"content":"вы загружаете файл в любом формате — мы разбираем его, индексируем содержимое и создаём базу знаний. задавайте вопросы через api или подключите к claude, chatgpt или cursor. никакой настройки — загрузили файл, получили ответы.","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"normal","id":"HORG2","lineHeight":1.5,"name":"desc","textGrowth":"fixed-width","type":"text","width":"fill_container"}]
```

### batch_get #37 (line 4969)
**Parent:** 6IA3K | **Patterns:** [{"name": "bigTitle|counter|detailsTitle|desc"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[{"content":"скопировали текст? просто вставьте — мы всё сделаем","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"cdGP1","name":"pasteDesc","type":"text"},{"content":"rag-as-a-service","fill":"$--accent","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"500","id":"pxxcO","name":"counter","type":"text"},{"content":"загружайте файлы —\nподключайте свой ии чат","fill":"$--black","fontFamily":"JetBrains Mono","fontSize":48,"fontWeight":"700","id":"PMvqZ","letterSpacing":-2,"lineHeight":1.05,"name":"bigTitle","textGrowth":"fixed-width","type":"text","width":"fill_container"},{"content":"как это работает","fill":"$--black","fontFamily":"JetBrains Mono","fontSize":14,"fontWeight":"700","id":"ANnbV","name":"detailsTitle","type":"text"},{"content":"вы загружаете файл в любом формате — мы разбираем его, индексируем содержимое и создаём базу знаний. задавайте вопросы через api или подключите к claude, chatgpt или cursor. никакой настройки — загрузили файл, получили ответы.","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"normal","id":"TIZem","lineHeight":1.5,"name":"desc","textGrowth":"fixed-width","type":"text","width":"fill_container"}]
```

### batch_get #38 (line 4971)
**Parent:** YEIYK | **Patterns:** [{"name": "bigTitle|counter|detailsTitle|desc"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[{"content":"скопировали текст? просто вставьте — мы всё сделаем","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"ZhX4Y","name":"pasteDesc","type":"text"},{"content":"rag-as-a-service","fill":"$--accent","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"500","id":"1gPlk","name":"counter","type":"text"},{"content":"загружайте файлы —\nподключайте свой ии чат","fill":"$--black","fontFamily":"JetBrains Mono","fontSize":48,"fontWeight":"700","id":"69Ain","letterSpacing":-2,"lineHeight":1.05,"name":"bigTitle","textGrowth":"fixed-width","type":"text","width":"fill_container"},{"content":"как это работает","fill":"$--black","fontFamily":"JetBrains Mono","fontSize":14,"fontWeight":"700","id":"WxyDF","name":"detailsTitle","type":"text"},{"content":"вы загружаете файл в любом формате — мы разбираем его, индексируем содержимое и создаём базу знаний. задавайте вопросы через api или подключите к claude, chatgpt или cursor. никакой настройки — загрузили файл, получили ответы.","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"normal","id":"Q2PWk","lineHeight":1.5,"name":"desc","textGrowth":"fixed-width","type":"text","width":"fill_container"}]
```

### batch_get #39 (line 4973)
**Parent:** KFvfw | **Patterns:** [{"name": "bigTitle|counter|detailsTitle|desc"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[{"content":"скопировали текст? просто вставьте — мы всё сделаем","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"DDkro","name":"pasteDesc","type":"text"},{"content":"rag-as-a-service","fill":"$--accent","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"500","id":"FpCir","name":"counter","type":"text"},{"content":"загружайте файлы —\nподключайте свой ии чат","fill":"$--black","fontFamily":"JetBrains Mono","fontSize":48,"fontWeight":"700","id":"gYACl","letterSpacing":-2,"lineHeight":1.05,"name":"bigTitle","textGrowth":"fixed-width","type":"text","width":"fill_container"},{"content":"как это работает","fill":"$--black","fontFamily":"JetBrains Mono","fontSize":14,"fontWeight":"700","id":"3s44H","name":"detailsTitle","type":"text"},{"content":"вы загружаете файл в любом формате — мы разбираем его, индексируем содержимое и создаём базу знаний. задавайте вопросы через api или подключите к claude, chatgpt или cursor. никакой настройки — загрузили файл, получили ответы.","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"normal","id":"mYXSm","lineHeight":1.5,"name":"desc","textGrowth":"fixed-width","type":"text","width":"fill_container"},{"content":"чтобы сохранить загруженные файлы и базу знаний,\nсоздайте бесплатный аккаунт.","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"normal","id":"hryPu","lineHeight":1.5,"name":"modalDesc","textGrowth":"fixed-width","type":"text","width":"fill_container"}]
```

### batch_get #40 (line 4978)
**Parent:** VMX2y | **Patterns:** [{"name": "dt2v|dt3v"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[]
```

### batch_get #41 (line 4980)
**Parent:** lQ8zz | **Patterns:** [{"name": "dt2v|dt3v"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[]
```

### batch_get #42 (line 4982)
**Parent:** Kmkwm | **Patterns:** [{"name": "dt2v|dt3v"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[]
```

### batch_get #43 (line 4984)
**Parent:** 6IA3K | **Patterns:** [{"name": "dt2v|dt3v"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[]
```

### batch_get #44 (line 4986)
**Parent:** YEIYK | **Patterns:** [{"name": "dt2v|dt3v"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[]
```

### batch_get #45 (line 4988)
**Parent:** KFvfw | **Patterns:** [{"name": "dt2v|dt3v"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[]
```

### batch_get #46 (line 4991)
**Parent:** VMX2y | **Patterns:** [{"type": "text"}] | **searchDepth:** 6 | **readDepth:** 0

```json
[{"content":"contexter","fill":"$--black","fontFamily":"JetBrains Mono","fontSize":20,"fontWeight":"500","id":"IGYz1","letterSpacing":-1,"name":"logo","type":"text"},{"content":"docs","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":14,"fontWeight":"normal","id":"M8l0B","name":"navLink1","type":"text"},{"content":"pricing","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":14,"fontWeight":"normal","id":"uTQa2","name":"navLink2","type":"text"},{"content":"перетащите файлы или вставьте текст","fill":"$--text-tertiary","fontFamily":"JetBrains Mono","fontSize":14,"fontWeight":"normal","id":"YSg3P","name":"dropText","textAlign":"center","type":"text"},{"content":"pdf · docx · xlsx · аудио · youtube · изображения · или просто текст","fill":"$--text-disabled","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"normal","id":"ur19E","name":"dropHint","textAlign":"center","type":"text"},{"content":"ctrl + v","fill":"$--white","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"BiZM6","name":"pasteKeyText","type":"text"},{"content":"скопировали текст? просто вставьте — мы всё сделаем","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"Rr9da","name":"pasteDesc","type":"text"},{"content":"↑ перетащите файл сюда или нажмите","fill":"$--accent","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"500","id":"cD8Py","name":"focusLabel","type":"text"},{"content":"единое хранилище знаний","fill":"$--accent","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"500","id":"BaM5r","name":"counter","type":"text"},{"content":"загрузите файлы —\nдоступ из любого ии чата","fill":"$--black","fontFamily":"JetBrains Mono","fontSize":48,"fontWeight":"700","id":"Od4bI","letterSpacing":-2,"lineHeight":1.05,"name":"bigTitle","textGrowth":"fixed-width","type":"text","width":"fill_container"},{"content":"как это работает","fill":"$--black","fontFamily":"JetBrains Mono","fontSize":20,"fo
... [truncated, 4184 chars total]
```

### batch_get #47 (line 4997)
**Parent:** lQ8zz | **Patterns:** [{"name": "dt2v"}] | **searchDepth:** 8 | **readDepth:** 0

```json
[{"content":"база знаний с семантическим поиском","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"500","id":"POjQ4","name":"dt2v","textGrowth":"fixed-width","type":"text","width":"fill_container"}]
```

### batch_get #48 (line 4999)
**Parent:** Kmkwm | **Patterns:** [{"name": "dt2v"}] | **searchDepth:** 8 | **readDepth:** 0

```json
[{"content":"база знаний с семантическим поиском","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"500","id":"vDvCe","name":"dt2v","textGrowth":"fixed-width","type":"text","width":"fill_container"}]
```

### batch_get #49 (line 5001)
**Parent:** 6IA3K | **Patterns:** [{"name": "dt2v"}] | **searchDepth:** 8 | **readDepth:** 0

```json
[{"content":"база знаний с семантическим поиском","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"500","id":"SaFnD","name":"dt2v","textGrowth":"fixed-width","type":"text","width":"fill_container"}]
```

### batch_get #50 (line 5003)
**Parent:** YEIYK | **Patterns:** [{"name": "dt2v"}] | **searchDepth:** 8 | **readDepth:** 0

```json
[{"content":"база знаний с семантическим поиском","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"500","id":"KzfLJ","name":"dt2v","textGrowth":"fixed-width","type":"text","width":"fill_container"}]
```

### batch_get #51 (line 5005)
**Parent:** KFvfw | **Patterns:** [{"name": "dt2v"}] | **searchDepth:** 8 | **readDepth:** 0

```json
[{"content":"база знаний с семантическим поиском","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"500","id":"Sk9hr","name":"dt2v","textGrowth":"fixed-width","type":"text","width":"fill_container"}]
```

### batch_get #52 (line 5007)
**Parent:** lQ8zz | **Patterns:** [{"name": "dt3v"}] | **searchDepth:** 8 | **readDepth:** 0

```json
[{"content":"claude, chatgpt, cursor, любой mcp-клиент","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"500","id":"3vQ2Q","name":"dt3v","textGrowth":"fixed-width","type":"text","width":"fill_container"}]
```

### batch_get #53 (line 5009)
**Parent:** Kmkwm | **Patterns:** [{"name": "dt3v"}] | **searchDepth:** 8 | **readDepth:** 0

```json
[{"content":"claude, chatgpt, cursor, любой mcp-клиент","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"500","id":"MKETK","name":"dt3v","textGrowth":"fixed-width","type":"text","width":"fill_container"}]
```

### batch_get #54 (line 5011)
**Parent:** 6IA3K | **Patterns:** [{"name": "dt3v"}] | **searchDepth:** 8 | **readDepth:** 0

```json
[{"content":"claude, chatgpt, cursor, любой mcp-клиент","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"500","id":"o7ygQ","name":"dt3v","textGrowth":"fixed-width","type":"text","width":"fill_container"}]
```

### batch_get #55 (line 5013)
**Parent:** YEIYK | **Patterns:** [{"name": "dt3v"}] | **searchDepth:** 8 | **readDepth:** 0

```json
[{"content":"claude, chatgpt, cursor, любой mcp-клиент","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"500","id":"LKBfy","name":"dt3v","textGrowth":"fixed-width","type":"text","width":"fill_container"}]
```

### batch_get #56 (line 5015)
**Parent:** KFvfw | **Patterns:** [{"name": "dt3v"}] | **searchDepth:** 8 | **readDepth:** 0

```json
[{"content":"claude, chatgpt, cursor, любой mcp-клиент","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"500","id":"pPbqF","name":"dt3v","textGrowth":"fixed-width","type":"text","width":"fill_container"}]
```

### batch_get #57 (line 5066)
**Parent:** wsBdo | **Patterns:** [{"name": "stg1t|stg2t|stg3t|stg4t"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[{"content":"читаем ✓","fill":"$--black","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"C8NPR","name":"stg1t","type":"text"},{"content":"разбиваем","fill":"$--accent","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"700","id":"5ntDR","name":"stg2t","type":"text"},{"content":"индексируем","fill":"$--text-tertiary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"aBoxU","name":"stg3t","type":"text"},{"content":"готово","fill":"$--text-tertiary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"GHn9R","name":"stg4t","type":"text"}]
```

### batch_get #58 (line 5068)
**Parent:** bXBws | **Patterns:** [{"name": "apiLabel|apiBlock|mcpRow"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[{"content":"API","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"NimCf","letterSpacing":1,"name":"apiLabel","type":"text"},{"children":"...","fill":"$--black","gap":4,"id":"9e2J0","layout":"vertical","name":"apiBlock","padding":16,"type":"frame","width":"fill_container"},{"alignItems":"center","children":"...","fill":"$--bg-surface","gap":8,"id":"cJ7rC","name":"mcpRow","padding":[8,12],"type":"frame","width":"fill_container"}]
```

### batch_get #59 (line 5106)
**Parent:** zUysf | **Patterns:** [{"name": "nrb1"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[]
```

### batch_get #60 (line 5108)
**Parent:** Psuqv | **Patterns:** [{"type": "ref"}] | **searchDepth:** 3 | **readDepth:** 0

```json
[]
```

### batch_get #61 (line 5110)
**Parent:**  | **Patterns:** [] | **searchDepth:**  | **readDepth:** 2

```json
[{"alignItems":"center","children":[{"content":"docs","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":14,"fontWeight":"normal","id":"eH6g5","name":"navLink1","type":"text"},{"content":"pricing","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":14,"fontWeight":"normal","id":"mUH0T","name":"navLink2","type":"text"},{"descendants":{"6GutY":{"content":"get started"}},"id":"XorMQ","name":"navCta","ref":"JND89","type":"ref","x":141}],"gap":24,"id":"Psuqv","name":"navRight","type":"frame"}]
```

### batch_get #62 (line 5129)
**Parent:**  | **Patterns:** [] | **searchDepth:**  | **readDepth:** 1

```json
[{"children":[{"alignItems":"center","children":"...","fill":"$--bg-surface","gap":16,"id":"PRD2r","name":"File Processing","padding":[16,20],"stroke":{"align":"inside","fill":"$--border-subtle","thickness":1},"type":"frame","width":"fill_container"},{"alignItems":"center","children":"...","id":"PMHBb","name":"Pipeline Progress","type":"frame","width":"fill_container"},{"children":"...","fill":"$--bg-surface","gap":12,"id":"vJFyF","layout":"vertical","name":"Chunk Preview","padding":20,"stroke":{"align":"inside","fill":"$--border-subtle","thickness":1},"type":"frame","width":"fill_container"}],"gap":24,"height":"fill_container","id":"3OBt9","layout":"vertical","name":"Upload Progress Area","padding":[32,64],"type":"frame","width":"fill_container"}]
```

### batch_get #63 (line 5138)
**Parent:** 6S039 | **Patterns:** [{"name": "fileName|fileMeta|fileIcon"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[{"fill":"$--text-secondary","height":20,"iconFontFamily":"lucide","iconFontName":"file-text","id":"Lh4g3","name":"fileIcon","type":"icon_font","width":20},{"content":"architecture.pdf","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":14,"fontWeight":"500","id":"LMy5K","name":"fileName","type":"text"},{"content":"2.1 мб · pdf · загружен только что","fill":"$--text-tertiary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"1zFWs","name":"fileMeta","type":"text"}]
```

### batch_get #64 (line 5145)
**Parent:** KuzFN | **Patterns:** [{"name": "fileName|fileMeta|fileIcon"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[{"fill":"$--text-secondary","height":20,"iconFontFamily":"lucide","iconFontName":"file-text","id":"xsRoy","name":"fileIcon","type":"icon_font","width":20},{"content":"architecture.pdf","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":14,"fontWeight":"500","id":"Vxt7P","name":"fileName","type":"text"},{"content":"2.1 мб · pdf · загружен только что","fill":"$--text-tertiary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"Gh4HZ","name":"fileMeta","type":"text"}]
```

### batch_get #65 (line 5149)
**Parent:** n3JlL | **Patterns:** [{"name": "errTitle|errMsg"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[{"content":"ошибка","fill":"$--signal-error","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"500","id":"z9NGw","name":"errTitle","type":"text"},{"content":"сервис временно перегружен. повторная попытка через 30 секунд.","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"normal","id":"74Coc","name":"errMsg","textGrowth":"fixed-width","type":"text","width":"fill_container"}]
```

### batch_get #66 (line 5153)
**Parent:** Vnifb | **Patterns:** [{"name": "pvLabel|pvText"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[{"content":"ЧТО МЫ ИЗВЛЕКЛИ","fill":"$--text-tertiary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"eYhk4","letterSpacing":1,"name":"pvLabel","type":"text"},{"content":"the system architecture follows a modular pipeline design.\neach stage operates independently: parse → chunk → embed → index.\nthis ensures fault isolation and allows individual stage optimization...","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"normal","id":"48GUV","lineHeight":1.5,"name":"pvText","textGrowth":"fixed-width","type":"text","width":"fill_container"}]
```

### batch_get #67 (line 5160)
**Parent:** 7hrpl | **Patterns:** [{"name": "dr2"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[{"alignItems":"center","children":"...","id":"m7ron","name":"dr2","padding":[10,16],"stroke":{"align":"inside","fill":"$--border-subtle","thickness":{"bottom":1}},"type":"frame","width":"fill_container"},{"content":"meeting-notes.ogg","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"normal","id":"ou39v","name":"dr2a","textGrowth":"fixed-width","type":"text","width":"fill_container"},{"content":"аудио","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"normal","id":"HUwn2","name":"dr2b","textGrowth":"fixed-width","type":"text","width":80},{"content":"12","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"normal","id":"Z9EeZ","name":"dr2c","textGrowth":"fixed-width","type":"text","width":80},{"id":"nnrAw","name":"dr2d","ref":"JTHAo","type":"ref","x":782,"y":10}]
```

### batch_get #68 (line 5164)
**Parent:** L7UTN | **Patterns:** [{"name": "dr1|s1v|s2v|s3v"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[{"content":"5","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":32,"fontWeight":"700","id":"F4gwe","name":"s1v","type":"text"},{"content":"47","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":32,"fontWeight":"700","id":"WckyU","name":"s2v","type":"text"},{"content":"47","fill":"$--accent","fontFamily":"JetBrains Mono","fontSize":32,"fontWeight":"700","id":"KW93d","name":"s3v","type":"text"},{"alignItems":"center","children":"...","id":"m8bje","name":"dr1","padding":[10,16],"stroke":{"align":"inside","fill":"$--border-subtle","thickness":{"bottom":1}},"type":"frame","width":"fill_container"},{"content":"architecture.pdf","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"normal","id":"XcSMt","name":"dr1a","textGrowth":"fixed-width","type":"text","width":"fill_container"},{"content":"pdf","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"normal","id":"0vrUv","name":"dr1b","textGrowth":"fixed-width","type":"text","width":80},{"content":"10","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"normal","id":"NhVgn","name":"dr1c","textGrowth":"fixed-width","type":"text","width":80},{"id":"2K3k6","name":"dr1d","ref":"JTHAo","type":"ref","x":782,"y":10}]
```

### batch_get #69 (line 5213)
**Parent:** AcMII | **Patterns:** [{"name": "qInput|ansText|srcLabel|src1|src2|ansLabel"}] | **searchDepth:** 3 | **readDepth:** 0

```json
[{"descendants":{"Kquvv":{"content":"попробуйте: что написано в architecture.pdf?"}},"id":"82WkK","name":"qInput","ref":"JTQb6","type":"ref","width":"fill_container","x":32,"y":69},{"content":"ОТВЕТ","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"huY4L","letterSpacing":1,"name":"ansLabel","type":"text"},{"content":"архитектура системы построена на модульном\nпайплайне. каждый этап работает независимо:\nпарсинг → чанкирование → эмбеддинги → индекс.\nразделение обеспечивает изоляцию ошибок и\nпозволяет оптимизировать каждый этап отдельно.","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"normal","id":"Rh222","lineHeight":1.5,"name":"ansText","textGrowth":"fixed-width","type":"text","width":"fill_container"},{"content":"ИСТОЧНИКИ","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"jDlxx","letterSpacing":1,"name":"srcLabel","type":"text"},{"alignItems":"center","children":"...","fill":"$--bg-surface","gap":8,"id":"FResi","name":"src1","padding":[8,12],"type":"frame","width":"fill_container"},{"fill":"$--accent","height":6,"id":"yEDeX","name":"src1d","type":"ellipse","width":6},{"content":"architecture.pdf · чанк #3 · 0.94","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"sz3rv","name":"src1t","type":"text"},{"alignItems":"center","children":"...","fill":"$--bg-surface","gap":8,"id":"wAPpH","name":"src2","padding":[8,12],"type":"frame","width":"fill_container"},{"fill":"$--accent","height":6,"id":"jmbFb","name":"src2d","type":"ellipse","width":6},{"content":"architecture.pdf · чанк #7 · 0.87","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"UZuMv","name":"src2t","type":"text"}]
```

### batch_get #70 (line 5220)
**Parent:** zQv8m | **Patterns:** [{"name": "qInput|focusAnnot"}] | **searchDepth:** 3 | **readDepth:** 0

```json
[{"descendants":{"Kquvv":{"content":""}},"id":"LkzEr","name":"qInput","ref":"JTQb6","stroke":{"align":"inside","fill":"$--accent","thickness":2},"type":"ref","width":"fill_container","x":32,"y":69},{"content":"← input в фокусе: border accent 2px, placeholder исчез","fill":"$--accent","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"5vrmF","name":"focusAnnot","type":"text"}]
```

### batch_get #71 (line 5227)
**Parent:** p7EJm | **Patterns:** [{"name": "src1"}] | **searchDepth:** 3 | **readDepth:** 1

```json
[{"alignItems":"center","children":[{"fill":"$--accent","height":6,"id":"qLlbj","name":"src1d","type":"ellipse","width":6},{"content":"architecture.pdf · чанк #3 · 0.94","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"sAJ2m","name":"src1t","type":"text"}],"fill":"$--bg-surface","gap":8,"id":"n94BK","name":"src1","padding":[8,12],"type":"frame","width":"fill_container"},{"fill":"$--accent","height":6,"id":"qLlbj","name":"src1d","type":"ellipse","width":6},{"content":"architecture.pdf · чанк #3 · 0.94","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"sAJ2m","name":"src1t","type":"text"}]
```

### batch_get #72 (line 5234)
**Parent:** mENU4 | **Patterns:** [{"name": "ansText|ansLabel|srcLabel|src1|src2"}] | **searchDepth:** 3 | **readDepth:** 0

```json
[{"content":"ОТВЕТ","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"XRpkp","letterSpacing":1,"name":"ansLabel","type":"text"},{"content":"архитектура системы построена на модульном\nпайплайне. каждый этап работает независимо:\nпарсинг → чанкирование → эмбеддинги → индекс.\nразделение обеспечивает изоляцию ошибок и\nпозволяет оптимизировать каждый этап отдельно.","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"normal","id":"WtQkh","lineHeight":1.5,"name":"ansText","textGrowth":"fixed-width","type":"text","width":"fill_container"},{"content":"ИСТОЧНИКИ","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"hCtm1","letterSpacing":1,"name":"srcLabel","type":"text"},{"alignItems":"center","children":"...","fill":"$--bg-surface","gap":8,"id":"0Gmmz","name":"src1","padding":[8,12],"type":"frame","width":"fill_container"},{"fill":"$--accent","height":6,"id":"yKjfK","name":"src1d","type":"ellipse","width":6},{"content":"architecture.pdf · чанк #3 · 0.94","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"asNHf","name":"src1t","type":"text"},{"alignItems":"center","children":"...","fill":"$--bg-surface","gap":8,"id":"LbYPL","name":"src2","padding":[8,12],"type":"frame","width":"fill_container"},{"fill":"$--accent","height":6,"id":"Y8mnP","name":"src2d","type":"ellipse","width":6},{"content":"architecture.pdf · чанк #7 · 0.87","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"f641f","name":"src2t","type":"text"}]
```

### batch_get #73 (line 5241)
**Parent:** QqubF | **Patterns:** [{"name": "ansText|srcLabel|src1|src2"}] | **searchDepth:** 3 | **readDepth:** 0

```json
[{"content":"архитектура системы построена на модульном\nпайплайне. каждый этап работает независимо:\nпарсинг → чанкирование → эмбеддинги → индекс.\nразделение обеспечивает изоляцию ошибок и\nпозволяет оптимизировать каждый этап отдельно.","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"normal","id":"NhUTw","lineHeight":1.5,"name":"ansText","textGrowth":"fixed-width","type":"text","width":"fill_container"},{"content":"ИСТОЧНИКИ","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"ZMhWL","letterSpacing":1,"name":"srcLabel","type":"text"},{"alignItems":"center","children":"...","fill":"$--bg-surface","gap":8,"id":"qK9Df","name":"src1","padding":[8,12],"type":"frame","width":"fill_container"},{"fill":"$--accent","height":6,"id":"pdG86","name":"src1d","type":"ellipse","width":6},{"content":"architecture.pdf · чанк #3 · 0.94","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"LF1WU","name":"src1t","type":"text"},{"alignItems":"center","children":"...","fill":"$--bg-surface","gap":8,"id":"B7Wtm","name":"src2","padding":[8,12],"type":"frame","width":"fill_container"},{"fill":"$--accent","height":6,"id":"IC7Wk","name":"src2d","type":"ellipse","width":6},{"content":"architecture.pdf · чанк #7 · 0.87","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"vVvek","name":"src2t","type":"text"}]
```

### batch_get #74 (line 5248)
**Parent:** rpehM | **Patterns:** [{"name": "detailLabel1|detailStats|detailLabel2|Chunk 1|Chunk 2|Chunk 3|delBtn"}] | **searchDepth:** 3 | **readDepth:** 0

```json
[{"content":"СТАТИСТИКА","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"JdHnF","letterSpacing":1,"name":"detailLabel1","type":"text"},{"children":"...","gap":16,"id":"A0Uub","name":"detailStats","type":"frame","width":"fill_container"},{"content":"ЧАНКИ","fill":"#808080","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"dkB9Z","letterSpacing":1,"name":"detailLabel2","type":"text"},{"children":"...","fill":"$--bg-surface","gap":4,"id":"FXHzY","layout":"vertical","name":"Chunk 1","padding":[12,16],"type":"frame","width":"fill_container"},{"children":"...","fill":"$--bg-surface","gap":4,"id":"YInmw","layout":"vertical","name":"Chunk 2","padding":[12,16],"type":"frame","width":"fill_container"},{"children":"...","fill":"$--bg-surface","gap":4,"id":"9xy3T","layout":"vertical","name":"Chunk 3","padding":[12,16],"type":"frame","width":"fill_container"},{"id":"r2EBT","name":"delBtn","ref":"EYKbU","type":"ref","x":32,"y":523}]
```

### batch_get #75 (line 5255)
**Parent:** rgFRC | **Patterns:** [{"name": "Chunk 1"}] | **searchDepth:** 3 | **readDepth:** 1

```json
[{"children":[{"content":"chunk #1","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"UcEMD","name":"ch1t","type":"text"},{"content":"the system architecture follows a modular pipeline design. each stage operates independently...","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"dUygS","lineHeight":1.4,"name":"ch1b","textGrowth":"fixed-width","type":"text","width":"fill_container"}],"fill":"$--bg-surface","gap":4,"id":"YOUjR","layout":"vertical","name":"Chunk 1","padding":[12,16],"type":"frame","width":"fill_container"}]
```

### batch_get #76 (line 5262)
**Parent:** cGeBp | **Patterns:** [{"name": "shareCopy"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[{"content":"скопировать","fill":"$--accent","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"zqzgn","name":"shareCopy","type":"text"}]
```

### batch_get #77 (line 5276)
**Parent:** gCoKu | **Patterns:** [{"name": "tr1a|tr1d"}] | **searchDepth:** 5 | **readDepth:** 0

```json
[{"content":"основной","fill":"$--text-primary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"normal","id":"fVfJU","name":"tr1a","textGrowth":"fixed-width","type":"text","width":"fill_container"},{"content":"отозвать","fill":"$--signal-error","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"FH6nK","name":"tr1d","textGrowth":"fixed-width","type":"text","width":80}]
```

### batch_get #78 (line 5288)
**Parent:** tDZMf | **Patterns:** [{"name": "modalInput|modalBtn"}] | **searchDepth:** 3 | **readDepth:** 0

```json
[{"height":40,"id":"kw65h","name":"modalInput","ref":"JTQb6","type":"ref","width":"fill_container","x":40,"y":237},{"descendants":{"6GutY":{"content":"продолжить"}},"height":"fit_content","id":"rV6WI","name":"modalBtn","ref":"JND89","type":"ref","width":"fill_container","x":40,"y":301}]
```

### batch_get #79 (line 5295)
**Parent:** Gd5Ki | **Patterns:** [{"name": "modalTitle|modalDesc|modalEmailLabel|modalInput|modalBtn|modalHint"}] | **searchDepth:** 3 | **readDepth:** 0

```json
[{"content":"создайте аккаунт","fill":"$--black","fontFamily":"JetBrains Mono","fontSize":24,"fontWeight":"700","id":"Dacck","letterSpacing":-1,"name":"modalTitle","type":"text"},{"content":"чтобы сохранить загруженные файлы и базу знаний,\nсоздайте бесплатный аккаунт.","fill":"$--text-secondary","fontFamily":"JetBrains Mono","fontSize":12,"fontWeight":"normal","id":"ALMdm","lineHeight":1.5,"name":"modalDesc","textGrowth":"fixed-width","type":"text","width":"fill_container"},{"content":"email","fill":"$--text-tertiary","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"500","id":"EowVp","name":"modalEmailLabel","type":"text"},{"height":40,"id":"vsMCA","name":"modalInput","ref":"JTQb6","type":"ref","width":"fill_container","x":40,"y":237},{"descendants":{"6GutY":{"content":"продолжить"}},"height":"fit_content","id":"5X1u8","name":"modalBtn","ref":"JND89","type":"ref","width":"fill_container","x":40,"y":301},{"content":"мы отправим ссылку для входа на указанный email.\nникаких паролей.","fill":"$--text-disabled","fontFamily":"JetBrains Mono","fontSize":10,"fontWeight":"normal","id":"VNhii","lineHeight":1.4,"name":"modalHint","textAlign":"center","textGrowth":"fixed-width","type":"text","width":"fill_container"}]
```

---

## 6. Editor State History

### Editor State #1 (line 113)

## Currently active editor
- `new`

## Document State:
- No nodes are selected.
- The document is empty (no top-level nodes).


### Reusable Components (0):
- No reusable components found.

### Editor State #2 (line 2276)

## Currently active editor
- `new`

## Document State:
- No nodes are selected.
- The document is empty (no top-level nodes).


### Reusable Components (0):
- No reusable components found.

### Editor State #3 (line 2996)

## Currently active editor
- `new`

## Document State:
- No nodes are selected.
- The document is empty (no top-level nodes).


### Reusable Components (0):
- No reusable components found.

### Editor State #4 (line 4057)

## Currently active editor
- `new`

## Document State:
- No nodes are selected.


### Top-Level Nodes (14):

- `tYjKC` (frame): 05 · Component Library [user visible]
- `EASNP` (frame): 06 · Elevation + Borders [user visible]
- `FFRVH` (frame): 07 · Motion System [user visible]
- `BiAIX` (frame): 01 · Color System [outside viewport]
- `U3ePH` (frame): 02 · Typography System [outside viewport]
- `wEM5D` (frame): 03 · Spacing System [outside viewport]
- `yWYpR` (frame): 04 · Logofolio [outside viewport]
- `xHYLt` (frame): 08 · State Machine [outside viewport]
- `XqCra` (frame): 09 · Grid System [outside viewport]
- `lwr2Z` (frame): 10 · Data Table [outside viewport]
- ... +4 others

### Reusable Components (11):
- `JND89`: Button/Primary
- `wlUN3`: Button/Secondary
- `oqBCN`: Button/Ghost
- `EYKbU`: Button/Danger
- `JTQb6`: Input/Default
- `9K6ma`: Badge/Processing
- `JTHAo`: Badge/Ready
- `WIOmX`: Badge/Error
- `tbd8x`: Badge/Pending
- `lRo74`: PipelineIndicator
- `YPAeU`: DropZone

---

## 7. Recovery Statistics

- Total batch_design calls: 199
- Design system artboards (file: new): 52 calls creating 14 numbered artboards + 4 early prototypes
- Contexter UI screens (file: contexter-ui.pen): 147 calls creating 47 screen artboards
- Reusable components: 11
- Total nodes created: ~1271
- Template frames (cloned via C()): 10 unique templates, 38 total clones
- batch_get calls: 79
- get_editor_state calls: 4
- get_screenshot calls: 100

### Screen State Coverage by Section

| Section | Screen States |
|---|---|
| 1. Hero | 6 |
| 10. Auth | 3 |
| 2. Upload/Drop | 6 |
| 3. Upload Complete | 3 |
| 4. Error States | 6 |
| 5. Dashboard | 6 |
| 6. Document Detail | 4 |
| 7. Query | 6 |
| 8. API | 5 |
| 9. Settings | 2 |
| **Total** | **47** |