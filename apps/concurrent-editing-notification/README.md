# Investigates concurrent editing notification

When an application has uncommitted changes, it is desirable to perform a consistency check before committing. This avoids other changes being overwritten when several changes have been made at different times.

In source code, reconciling these changes is usually a manual process. It can be assisted with a change detection mechanism to compare the deltas and see if there are any overlapping changed files or sections of a file. If there are none, the merge can be performed automatically.

When an application has a long editing session, others will be making changes to some or all of the same data in real-time. Should another change be made that affects a non-overlapping subtree than the current user, the purpose for the change should be made visible to the user to help inform of a potential breaking change.



> Note 1: The scenario described above is implicitly assuming a real-time collaboration with longer Smart Data Contract editing sessions. Needs to be said that similar to any long database transactions, this is fundamentally an anti-pattern.

> Note 2: There are other situations, such with reconciling offline work. This is manifested with collaborators working in development branches and would need to reconcile local changes vs. remote changes. Identifying conflicts and having powerful merge mechanisms is essential. This scenario is also interesting as would essentially follow other known best-practices from SCM world, such continuous integration (integrate early, integrate often). Deserves mentioned that Smart Data Contract infrastructure is not supporting branching and offline work at this stage.