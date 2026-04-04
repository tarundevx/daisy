import { WebContainer } from '@webcontainer/api';

let bootPromise = null;

export const bootWebContainer = () => {
  if (!bootPromise) {
    bootPromise = WebContainer.boot();
  }
  return bootPromise;
};

export const mountProject = async (wc, files) => {
  await wc.mount(files);
};

export const runTests = async (wc, onOutput) => {
  let needsInstall = true;
  try {
    const dir = await wc.fs.readdir('node_modules');
    if (dir && dir.length > 0) needsInstall = false;
  } catch (e) {
    // Directory doesn't exist
  }

  if (needsInstall) {
    onOutput('Running npm install (Optimized)...\r\n');
    const installProcess = await wc.spawn('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error']);
    
    installProcess.output.pipeTo(new WritableStream({
      write(data) {
        onOutput(data);
      }
    }));
    
    const installExitCode = await installProcess.exit;
    if (installExitCode !== 0) {
      onOutput('\r\nInstallation failed.\r\n');
      return null;
    }
  } else {
    onOutput('Dependencies cached! Skipping npm install.\r\n');
  }
  
  // Run tests
  onOutput('\r\nRunning tests natively without Jest...\r\n');
  const testProcess = await wc.spawn('npm', ['test']);
  
  let resultOutput = '';
  testProcess.output.pipeTo(new WritableStream({
    write(data) {
      onOutput(data);
      resultOutput += data;
    }
  }));
  
  await testProcess.exit;
  
  // Extract JSON output from Jest
  try {
    const signature = '{"numFailedTestSuites"';
    const jsonStart = resultOutput.indexOf(signature);
    const jsonEnd = resultOutput.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd >= jsonStart) {
       const jsonString = resultOutput.substring(jsonStart, jsonEnd + 1);
       return JSON.parse(jsonString);
    } else {
       console.error("Could not find JSON output signature.");
       return null;
    }
  } catch (e) {
    console.error('Error parsing Jest output:', e);
    return null;
  }
};
