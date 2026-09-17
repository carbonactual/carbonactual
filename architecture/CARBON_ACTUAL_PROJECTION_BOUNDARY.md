# Carbon Actual Projection Boundary

Status: canonical technical contract.

The Root, Index, Vault, Actual and Atlas roles are distinct projections/access surfaces over canonical records. They do not constitute independent universes or competing sources of truth.

| Role | Primary purpose | Authority position |
|---|---|---|
| Root | authoritative contextual/entity-specific source | source/provenance context |
| Index | general discovery/directory | discovery only |
| Vault | protected sensitive/high-value custody | protected record access |
| Actual | operational current experience/state | derived operational projection |
| Atlas | verified public/profile/discovery | curated public projection |

## Projection rules

1. Every projection identifies the canonical entity/object it represents.
2. Access controls are stricter than visibility requirements where appropriate.
3. Projection caches may be rebuilt from canonical records.
4. A public Atlas representation must not silently expose Vault material.
5. Actual may be optimized for current-state access but cannot erase evidence/history.
6. Index may use search/graph technology but must not invent identity or authority.
7. Root and Vault can retain stronger provenance/security metadata than exposed views.
8. Domain branches can create additional views, but those views inherit these boundaries.

## Projection lifecycle

```text
canonical object/event/evidence
          -> authorization-aware projector
          -> Root / Index / Vault / Actual / Atlas
          -> invalidation/rebuild on canonical state change
```

A projection failure is a continuity issue, not a reason to create a second canonical source.
