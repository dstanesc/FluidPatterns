# Investigates concurrent editing notification

When an application has uncommitted changes, it is desirable to perform a consistency check before committing. This avoids other changes being overwritten when several changes have been made at different times.

In source code, reconciling these changes is usually a manual process. It can be assisted with a change detection mechanism to compare the deltas and see if there are any overlapping changed files or sections of a file. If there are none, the merge can be performed automatically.

When an application has a long editing session, others will be making changes to some or all of the same data in real-time. Should another change be made that affects a non-overlapping subtree than the current user, the purpose for the change should be made visible to the user to help inform of a potential breaking change.