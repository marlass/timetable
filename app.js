const combinatorics = require('js-combinatorics');
const fs = require('fs');
const sugar = require('sugar');

sugar.extend();

let timetable;

fs.readFile('./w8_inf_pl_5_2016.json', (err, data) => {
    if (err) throw err;
    timetable = JSON.parse(data);

    let lessonsGroups = getLessonsGroups(timetable.lessons, timetable.timetable);
    let modulesGroups = getModulesGroups(timetable.lessons, lessonsGroups);
    let modulesPowerSets = getModulesCombinations(modulesGroups, timetable);
    //console.log(modulesGroups);
    console.log(modulesPowerSets);
});

function getLessonsGroups(lessonsList, timetable) {
    let lessonsGroups = [];
    lessonsList.forEach(function (el) {
        lessonsGroups[el.lesson] = [];
    })
    timetable.forEach(function (el) {
        if (el.lesson in lessonsGroups) {
            lessonsGroups[el.lesson].push(el.code);
        } else {
            lessonsGroups[el.lesson] = [el.code];
        }
    });
    return lessonsGroups;
}

function getModulesGroups(lessonsList, lessonsGroups) {
    let modulesGroups = [];
    lessonsList.forEach(function (el) {
        if (el.hasOwnProperty("module")) {
            if (el.module in modulesGroups) {
                modulesGroups[el.module] = modulesGroups[el.module].concat(lessonsGroups[el.lesson]);
            } else {
                modulesGroups[el.module] = lessonsGroups[el.lesson];
            }
        } else {
            modulesGroups[el.lesson] = lessonsGroups[el.lesson];
        }
    });

    return modulesGroups;
}

function getPossibleLessonCombinations(set, timetable) {
    let array = [[]],
        sub_set = function (n, m) {
            let result = [];

            if (m == 1) {
                result.push([set[n]]);
            } else {
                for (let i = n, length = set.length; i < length - 1; i += 1) {
                    let subset = sub_set(i + 1, m - 1);
                    for (let j = 0; j < subset.length; j += 1) {
                        let new_set = subset[j];
                        new_set.push(set[n]);
                        result.push(new_set);
                    }
                }
            }
            return result;
        };

    let valid = 0;
    for (let i = 0, length = set.length; i < length; i += 1) {
        for (let j = 1; j < length + 1; j += 1) {
            let temp = sub_set(i, j);
            for (let k = 0; k < temp.length; k += 1) {
                if (isValidCombination(temp[k], timetable)) {
                    array.push(temp[k]);
                    valid++;
                    console.log('valid: ' + valid + '/' + Math.pow(2, set.length));
                }
            }
        }
    }
    return array;
};

function isValidCombination(combination, timetable) {
    if (combination.length > 0) {
        let lesson = timetable.timetable.find(function (el) {
            return el.code = combination[0];
        });
        let lessonDefinition = timetable.lessons.find(function (el) {
            return el.lesson = lesson.lesson;
        });
        if (lessonDefinition.hasOwnProperty("module")) {
            let moduleDefinition = timetable.modules.find(function (el) {
                return el.module = lessonDefinition.module;
            });
            let requiredHoursW = moduleDefinition.hoursW || 0;
            let requiredHoursC = moduleDefinition.hoursC || 0;
            let requiredHoursL = moduleDefinition.hoursL || 0;
            let requiredHoursP = moduleDefinition.hoursP || 0;
            let requiredHoursS = moduleDefinition.hoursS || 0;
            let actualHoursW = 0;
            let actualHoursC = 0;
            let actualHoursL = 0;
            let actualHoursP = 0;
            let actualHoursS = 0;
            for (let i = 0; i < combination.length; i++) {
                let item = timetable.timetable.find(function (el) {
                    return el.code = combination[i];
                });
                let itemLesson = timetable.lessons.find(function (el) {
                    return el.lesson = item.lesson;
                })
                let itemType = getItemType(item.lesson);
                switch (itemType) {
                    case 'W':
                        actualHoursW += countHours(item, timetable.breaks);
                        break;
                    case 'C':
                        actualHoursC += countHours(item, timetable.breaks);
                        break;
                    case 'L':
                        actualHoursL += countHours(item, timetable.breaks);
                        break;
                    case 'P':
                        actualHoursP += countHours(item, timetable.breaks);
                        break;
                    case 'S':
                        actualHoursS += countHours(item, timetable.breaks);
                        break;
                }

                if (actualHoursW > requiredHoursW ||
                    actualHoursC > requiredHoursC ||
                    actualHoursL > requiredHoursL ||
                    actualHoursP > requiredHoursP ||
                    actualHoursS > requiredHoursS ||
                    itemLesson.lmodule !== moduleDefinition.module) {
                    return false;
                } else if (moduleDefinition.same && itemLesson.lesson.slice(0, itemLesson.lesson.length - 1) !== lessonDefinition.lesson.slice(0, lessonDefinition.lesson.length - 1)) {
                    return false;
                }
            }
            return true;
        } else {
            let requiredHours = lessonDefinition.hours;
            let actualHours = 0;
            for (let i = 0; i < combination.length; i++) {
                let item = timetable.timetable.find(function (el) {
                    return el.code = combination[i];
                });
                actualHours += countHours(item, timetable.breaks);
                if (actualHours > requiredHours || item.lesson !== lessonDefinition.lesson) {
                    return false;
                }
            }
            return true;
        }
    } else {
        return false;
    }
}

function countHours(item, breaks) {
    //make proper function to calculate length of lesson
    if (item.week === "E" || item.week === "O") {
        return 1;
    } else {
        return 2;
    }
}

function itemType(code) {
    code.slice(-1);
}

function getModulesCombinations(modulesGroups, timetable) {
    let modulesPowerSets = [];
    Object.keys(modulesGroups).forEach(function (key) {
        modulesPowerSets[key] = getPossibleLessonCombinations(modulesGroups[key], timetable);
    });
    return modulesPowerSets;
}


