import * as config from 'config';
import { isLoggedIn, login } from './login';
import { fetchAllCoursesAvailableToDownload, downloadCourse } from './download';
import { ALL_COURSES_API, COURSE_URL_PREFIX } from './globals';
import { getBrowser } from './browser';

const COURSE_URL: string = config.get('courseUrl');
const LOGIN_CHECK: boolean = config.get('loginCheck');
const DOWNLOAD_ALL_COURSES: boolean = config.get('downloadAllCourses');

async function main(): Promise<void> {

  if (!DOWNLOAD_ALL_COURSES && !COURSE_URL) {
    console.log('Either set courseUrl or make downloadAllCourses true in config file.\nExitting now...');
    return;
  }

  console.log(`CHECK IF ALREADY LOGGEDIN: ${LOGIN_CHECK}`);

  if (LOGIN_CHECK) {
    const loggedIn = await isLoggedIn();

    if (!loggedIn) {
      await login();
    } else {
      console.log('Already logged in');
    }
  }

  if (DOWNLOAD_ALL_COURSES) {
    console.log('Getting all the available courses to download...');

    console.time('fetchAllCoursesAvailableToDownload');
    const courseUrlSlugList = await fetchAllCoursesAvailableToDownload(ALL_COURSES_API);
    console.timeEnd('fetchAllCoursesAvailableToDownload');

    if (courseUrlSlugList.length < 1) {
      console.log('No Courses Available to download.');
      (await getBrowser()).close();
      return;
    }

    console.log(`Found a total of ${courseUrlSlugList.length} courses to download.`);

    console.log(`Downloading all the available courses now.`);
    for (const courseUrlSlug of courseUrlSlugList) {
      console.log(COURSE_URL_PREFIX + courseUrlSlug);
    }

    for (const courseUrlSlug of courseUrlSlugList) {
      console.time(courseUrlSlug);
      await downloadCourse(COURSE_URL_PREFIX + courseUrlSlug);
      console.timeEnd(courseUrlSlug);
    }
  } else {
    await downloadCourse(COURSE_URL);
  }

  (await getBrowser()).close();

  console.log('=> Done');
}

/**
 * Handle unhandled promise rejection
 */
process.on('unhandledRejection', (error) => {
  console.error(error);
  process.exit(1);
});

/**
 * Handle uncaught exception
 */
process.on('uncaughtException', (error) => {
  console.error(error);
  process.exit(1);
});

/**
 * Run the main function
 */
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
