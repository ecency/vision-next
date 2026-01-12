# Render Helper

Ecency markdown+html render helper

- custom markdown to html
- custom markdown to amp
- content summary extract
- customize proxy endpoint
- image links proxify
- catch content image/thumbnail
- embedded media filters
- internalized links
- cached responses
- xss protection


## Pull request guide

- If you want to fix a bug or add new feature, please add relevant tests
- Do not load external js or libraries when adding embed supports, it compromises the security
- Make sure all tests pass without breaking existing structure
- Make sure to increase version number in package.json, so CI can auto publish new version
