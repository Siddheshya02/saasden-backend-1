<#list reports as report>
    <#-- Report level -->
    <#list report.transactionList as expense>
        ${expense.merchant},<#t>
        ${expense.amount},<#t>
        ${expense.category}<#lt>
    </#list>
</#list>