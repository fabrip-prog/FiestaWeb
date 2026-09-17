const fs = require('fs');
const html = fs.readFileSync('C:/Users/Fabrizio/OneDrive/Desktop/WildFest/index.html', 'utf8');
const scripts = html.match(/<script>([\s\S]*?)<\/script>/g);
if (scripts) {
    scripts.forEach((s, i) => {
        const code = s.replace(/<script>/, '').replace(/<\/script>/, '');
        fs.writeFileSync(`temp_${i}.js`, code);
        try {
            require('child_process').execSync(`node -c temp_${i}.js`);
            console.log(`Script ${i} syntax OK`);
        } catch (e) {
            console.error(`Script ${i} syntax ERROR:`, e.stderr.toString());
        }
    });
}
