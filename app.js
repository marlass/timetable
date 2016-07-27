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
    let toProduct = [];
    for (let items in modulesPowerSets){
        toProduct.push( modulesPowerSets[items] );
    }
    
    for (let p of product.apply(this,toProduct)) {
    console.log(p);
    }
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

function getPossibleLessonCombinations(list, timetable){
    let set = [],
        listSize = list.length,
        combinationsCount = Math.pow(2,listSize),
        combination = [],
        valid = 0;;

    for (let i = 1; i < combinationsCount ; i++ ){
        let combination = [];
        for (var j=0;j<listSize;j++){
            if ((i & (1 << j))){
                combination.push(list[j]);
            }
        }
        if (isValidCombination(combination,timetable)){
            set.push(combination);
            valid++;
            console.log('valid: '+valid+'/'+combinationsCount);
        }
        
    }
    return set;
}

function isValidCombination(combination, timetable) {
    if (combination.length > 0) {
        let lesson = timetable.timetable.find(function (el) {
            return el.code === combination[0];
        });
        let lessonDefinition = timetable.lessons.find(function (el) {
            return el.lesson === lesson.lesson;
        });
        if (lessonDefinition.hasOwnProperty("module")) {
            let moduleDefinition = timetable.modules.find(function (el) {
                return el.module === lessonDefinition.module;
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
                    return el.code === combination[i];
                });
                let itemLesson = timetable.lessons.find(function (el) {
                    return el.lesson === item.lesson;
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
                    itemLesson.module !== moduleDefinition.module) {
                    return false;
                } else if (moduleDefinition.same && itemLesson.lesson.slice(0, itemLesson.lesson.length - 1) !== lessonDefinition.lesson.slice(0, lessonDefinition.lesson.length - 1)) {
                    return false;
                }
            }
            if (actualHoursW !== requiredHoursW ||
                actualHoursC !== requiredHoursC ||
                actualHoursL !== requiredHoursL ||
                actualHoursP !== requiredHoursP ||
                actualHoursS !== requiredHoursS) {
                return false;
            }
            return true;
        } else {
            let requiredHours = lessonDefinition.hours;
            let actualHours = 0;
            for (let i = 0; i < combination.length; i++) {
                let item = timetable.timetable.find(function (el) {
                    return el.code === combination[i];
                });
                actualHours += countHours(item, timetable.breaks);
                if (actualHours > requiredHours || item.lesson !== lessonDefinition.lesson) {
                    return false;
                }
            }
            if (actualHours !== requiredHours) {
                return false;
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

function getItemType(code) {
    return code.slice(-1);
}

function getModulesCombinations(modulesGroups, timetable) {
    let modulesPowerSets = [];
    let i = 0;
    Object.keys(modulesGroups).forEach(function (key) {
        i++;
        if (i!==3)
        modulesPowerSets[key] = getPossibleLessonCombinations(modulesGroups[key], timetable);
    });
    return modulesPowerSets;
}

function *productHelper(lists, prefix = []) {
  if (lists.length === 0) {
    yield [];
  } else {
    const [head, ...rest] = lists;
    for (let item of head) {
      const newPrefix = prefix.concat(item);
      if (rest.length) {
        yield *productHelper(rest, newPrefix);
      } else {
        yield newPrefix;
      }
    }
  }
}

function *product(...lists) {
  yield *productHelper(lists);
}



