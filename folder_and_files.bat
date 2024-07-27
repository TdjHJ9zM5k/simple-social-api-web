@echo off
rem Create directories
mkdir src\hooks
mkdir src\styles
mkdir src\utils

rem Create files in components directory
echo. > src\components\AppBarComponent.js
echo. > src\components\CommentList.js
echo. > src\components\LoginForm.js
echo. > src\components\PostList.js
echo. > src\components\UserList.js
echo. > src\components\PostForm.js

rem Create file in hooks directory
echo. > src\hooks\useFetchData.js

rem Create file in styles directory
echo. > src\styles\styles.js

rem Create file in utils directory
echo. > src\utils\utils.js

rem Output to confirm completion
echo Folder structure and files created successfully.
pause
