# INC0020005 – User can't find a knowledge article others can see

| Field | Value |
|---|---|
| Number | INC0020005 |
| Caller | Zoe Turner (Seasonal Associate, Store 102) |
| Category / Subcategory | Software / ServiceNow – Knowledge |
| Configuration Item | Knowledge base: IT Self-Service |
| Impact / Urgency / Priority | 3 – Low (one user) / 3 – Low / **P5** |
| Assignment group | ServiceNow Platform Admins |

## Symptoms (as reported)
> "My manager told me to search 'store Wi-Fi' in the portal, but I get no results. He showed me the same search on his account and the article is right there."

## Diagnosis

| Step | Check | Result |
|---|---|---|
| 1 | Impersonated zoe.turner → portal search "Wi-Fi" | No results. As ahmed.hassan → *Connect to the store Wi-Fi* found. |
| 2 | Article state and dates | Published, Valid to 2100-01-01, no article-level *Can read* override → the article itself is fine. |
| 3 | KB *IT Self-Service* → Can Read | User criteria **NorthPeak Employees** (Company = NorthPeak Home Supply). |
| 4 | zoe.turner user record | **Company empty** (same record as Scenario 2). ahmed.hassan has Company = NorthPeak. |
| 5 | User criteria diagnostics (if available on your release) / manual check | zoe.turner doesn't match any Can Read criteria → the KB is invisible to her. |

## Root cause
Read access to the knowledge base is granted through user criteria based on **Company**. The user's Company field was empty, so she didn't match, and every article in the KB was hidden from her. Knowledge search never shows articles a user can't read, so there's no error — the article simply doesn't appear.

## Resolution
1. Set zoe.turner's Company = NorthPeak Home Supply (same data fix as INC0020002).
2. User criteria results can be cached; had the user log out and back in.
3. Impersonated zoe.turner → article found.

## Prevention
- Consider basing read access on a more reliable attribute (e.g. *Active users with a company OR in any NorthPeak location*), or add a second user criteria record — multiple *Can Read* records are OR'd.
- Remember **Cannot Read** always wins over Can Read.
- Data-quality report for users missing Company/Manager (shared with Scenario 2).

## Other causes of "can't see an article"
| Cause | Check |
|---|---|
| Article not Published (Draft, Review, Retired, Outdated) | Workflow state on the article |
| *Valid to* date in the past | Valid to field |
| Article-level Can read / Cannot read overrides the KB | Article → *Can read* / *Cannot read* fields |
| User criteria with **Match all** ticked unexpectedly | User criteria record |
| Portal uses a different KB or search source | Portal's search sources configuration |
